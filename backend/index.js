/**
 * Minimal Express API starter for خدمات منزلية
 * - Sequelize for Postgres models (basic)
 * - JWT auth (login/register)
 * - Simple routes: /auth, /users, /requests, /offers, /transactions, /reviews
 *
 * This is a scaffold: expand validation, error handling, and secure production settings.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  port: process.env.DB_PORT || 5432,
  logging: false
});

// Models
const User = sequelize.define('User', {
  fullName: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, unique: true, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('client','provider','admin'), defaultValue: 'client' },
  city: { type: DataTypes.STRING },
  serviceTypes: { type: DataTypes.STRING } // comma-separated for simple scaffold
});

const ServiceRequest = sequelize.define('ServiceRequest', {
  type: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  location: { type: DataTypes.STRING },
  preferredTime: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('new','offered','accepted','in_progress','completed','cancelled'), defaultValue: 'new' }
});

const Offer = sequelize.define('Offer', {
  price: { type: DataTypes.FLOAT, allowNull: false },
  estimatedArrivalMin: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('pending','accepted','rejected'), defaultValue: 'pending' }
});

const Transaction = sequelize.define('Transaction', {
  amount: { type: DataTypes.FLOAT, allowNull: false },
  type: { type: DataTypes.ENUM('payment','commission','payout'), allowNull: false },
  status: { type: DataTypes.ENUM('pending','completed','failed'), defaultValue: 'pending' }
});

const Review = sequelize.define('Review', {
  rating: { type: DataTypes.INTEGER, allowNull: false },
  comment: { type: DataTypes.TEXT }
});

// Associations
User.hasMany(ServiceRequest, { as: 'requests', foreignKey: 'clientId' });
ServiceRequest.belongsTo(User, { as: 'client', foreignKey: 'clientId' });

User.hasMany(Offer, { as: 'offersMade', foreignKey: 'providerId' });
Offer.belongsTo(User, { as: 'provider', foreignKey: 'providerId' });
Offer.belongsTo(ServiceRequest, { as: 'request', foreignKey: 'requestId' });

User.hasMany(Transaction, { as: 'transactions', foreignKey: 'userId' });
Transaction.belongsTo(User, { as: 'user', foreignKey: 'userId' });

ServiceRequest.hasMany(Review, { as: 'reviews', foreignKey: 'requestId' });
Review.belongsTo(User, { as: 'author', foreignKey: 'authorId' });

// Utility
const generateToken = (user) => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });

// Routes
app.post('/auth/register', async (req,res) => {
  const { fullName, phone, email, password, role, city, serviceTypes } = req.body;
  if(!phone || !password || !fullName) return res.status(400).json({ error: 'missing_fields' });
  const hash = await bcrypt.hash(password, 10);
  try{
    const user = await User.create({ fullName, phone, email, passwordHash: hash, role, city, serviceTypes });
    return res.json({ token: generateToken(user), user: { id: user.id, fullName: user.fullName, role: user.role } });
  }catch(e){
    console.error(e);
    return res.status(400).json({ error: 'create_failed' });
  }
});

app.post('/auth/login', async (req,res) => {
  const { phone, password } = req.body;
  const user = await User.findOne({ where: { phone } });
  if(!user) return res.status(401).json({ error: 'invalid_credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if(!ok) return res.status(401).json({ error: 'invalid_credentials' });
  return res.json({ token: generateToken(user), user: { id: user.id, fullName: user.fullName, role: user.role } });
});

// Auth middleware
const authMiddleware = async (req,res,next) => {
  const header = req.headers.authorization;
  if(!header) return res.status(401).json({ error: 'no_token' });
  const token = header.replace('Bearer ','');
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET || 'dev');
    req.user = await User.findByPk(data.id);
    next();
  } catch(e){
    return res.status(401).json({ error: 'invalid_token' });
  }
};

// Example protected route: create request (client)
app.post('/requests', authMiddleware, async (req,res) => {
  if(req.user.role !== 'client') return res.status(403).json({ error: 'only_clients' });
  const { type, description, location, preferredTime } = req.body;
  const r = await ServiceRequest.create({ type, description, location, preferredTime, clientId: req.user.id });
  return res.json(r);
});

// Providers can view requests (basic filter by status and optionally city)
app.get('/requests', authMiddleware, async (req,res) => {
  const { status } = req.query;
  const where = {};
  if(status) where.status = status;
  const list = await ServiceRequest.findAll({ where, include: [{ model: User, as: 'client', attributes: ['id','fullName','phone'] }] });
  return res.json(list);
});

// Provider sends offer
app.post('/offers', authMiddleware, async (req,res) => {
  if(req.user.role !== 'provider') return res.status(403).json({ error: 'only_providers' });
  const { requestId, price, estimatedArrivalMin, notes } = req.body;
  const offer = await Offer.create({ requestId, providerId: req.user.id, price, estimatedArrivalMin, notes });
  // mark request as 'offered' (simple)
  await ServiceRequest.update({ status: 'offered' }, { where: { id: requestId } });
  return res.json(offer);
});

// Client accepts an offer: change statuses and create transaction (pending)
app.post('/offers/:id/accept', authMiddleware, async (req,res) => {
  const offer = await Offer.findByPk(req.params.id);
  if(!offer) return res.status(404).json({ error: 'no_offer' });
  const request = await ServiceRequest.findByPk(offer.requestId);
  if(request.clientId !== req.user.id) return res.status(403).json({ error: 'not_owner' });
  offer.status = 'accepted';
  await offer.save();
  request.status = 'accepted';
  await request.save();
  // Create pending transaction record (client will pay or pay in-cash)
  const commissionPercent = Number(process.env.APP_COMMISSION_PERCENT || 10);
  const commission = (offer.price * commissionPercent) / 100;
  const tx = await Transaction.create({ amount: offer.price, type: 'payment', status: 'pending', userId: req.user.id });
  // For production: integrate payment gateway, escrow logic, and webhooks
  return res.json({ offer, commission, txId: tx.id });
});

// Provider marks job completed
app.post('/requests/:id/complete', authMiddleware, async (req,res) => {
  const reqItem = await ServiceRequest.findByPk(req.params.id);
  if(reqItem && req.user.role === 'provider') {
    reqItem.status = 'completed';
    await reqItem.save();
    return res.json({ ok: true });
  }
  return res.status(403).json({ error: 'forbidden' });
});

// Client posts review
app.post('/reviews', authMiddleware, async (req,res) => {
  const { requestId, rating, comment } = req.body;
  const rev = await Review.create({ requestId, rating, comment, authorId: req.user.id });
  return res.json(rev);
});

// Admin-only: get statistics
app.get('/admin/stats', authMiddleware, async (req,res) => {
  if(req.user.role !== 'admin') return res.status(403).json({ error: 'admin_only' });
  const usersCount = await User.count();
  const requestsCount = await ServiceRequest.count();
  const offersCount = await Offer.count();
  return res.json({ usersCount, requestsCount, offersCount });
});

// Init DB and start
(async () => {
  await sequelize.sync({ alter: true });
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log('API listening on', port));
})();