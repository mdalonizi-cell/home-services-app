-- SQL schema reference for PostgreSQL (simplified)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'client',
  city VARCHAR(100),
  service_types TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE service_requests (
  id SERIAL PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  location TEXT,
  preferred_time VARCHAR(255),
  client_id INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE offers (
  id SERIAL PRIMARY KEY,
  request_id INTEGER REFERENCES service_requests(id),
  provider_id INTEGER REFERENCES users(id),
  price NUMERIC(10,2),
  estimated_arrival_min INTEGER,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount NUMERIC(12,2),
  type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  request_id INTEGER REFERENCES service_requests(id),
  author_id INTEGER REFERENCES users(id),
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMP DEFAULT now()
);