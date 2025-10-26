import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

function Home(){ return <div style={{padding:20}}>واجهة تطبيق - صفحات جاهزة: <ul><li><Link to='/login'>تسجيل دخول</Link></li><li><Link to='/create'>إنشاء طلب</Link></li><li><Link to='/offers'>استعراض العروض</Link></li><li><Link to='/payment'>دفع/تأكيد</Link></li><li><Link to='/review'>تقييم</Link></li><li><Link to='/admin'>لوحة التحكم</Link></li></ul></div> }

function Login(){ return <div style={{padding:20}}><h2>تسجيل دخول</h2><p>نموذج جاهز للتوصيل إلى API</p></div> }
function Create(){ return <div style={{padding:20}}><h2>إنشاء طلب</h2><p>حقول: نوع الخدمة، وصف، رفع صورة، موقع، وقت مفضل</p></div> }
function Offers(){ return <div style={{padding:20}}><h2>العروض</h2><p>قائمة العروض مع السعر والوقت والتقييم</p></div> }
function Payment(){ return <div style={{padding:20}}><h2>الدفع والتأكيد</h2><p>خيارات: دفع داخل التطبيق أو كاش، عرض عمولة التطبيق</p></div> }
function Review(){ return <div style={{padding:20}}><h2>إرسال تقييم</h2><p>نجوم + تعليق</p></div> }
function Admin(){ return <div style={{padding:20}}><h2>لوحة تحكم (نسخة مبسطة)</h2><p>إحصائيات وجداول</p></div> }

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home/>} />
      <Route path="/login" element={<Login/>} />
      <Route path="/create" element={<Create/>} />
      <Route path="/offers" element={<Offers/>} />
      <Route path="/payment" element={<Payment/>} />
      <Route path="/review" element={<Review/>} />
      <Route path="/admin" element={<Admin/>} />
    </Routes>
  </BrowserRouter>
)