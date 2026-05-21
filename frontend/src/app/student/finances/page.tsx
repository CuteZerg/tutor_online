'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Wallet, CreditCard, ChevronRight, CheckCircle2, Loader2, Landmark, ShieldCheck } from 'lucide-react';

export default function StudentFinancesPage() {
  const { user, fetchUser } = useAuthStore();
  const [selectedAmount, setSelectedAmount] = useState<number>(3000);
  const [customAmount, setCustomAmount] = useState<string>('');
  
  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // Payment Status State
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const getAmount = () => {
    if (customAmount) {
      return parseInt(customAmount, 10) || 0;
    }
    return selectedAmount;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 16);
    // Format card number: XXXX XXXX XXXX XXXX
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (value.length >= 2) {
      setExpiry(`${value.substring(0, 2)}/${value.substring(2)}`);
    } else {
      setExpiry(value);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 3);
    setCvv(value);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = getAmount();
    if (amount <= 0) {
      alert('Пожалуйста, выберите или введите корректную сумму');
      return;
    }

    setLoading(true);
    try {
      // Simulate bank verification delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Real API Call to credit the balance in PostgreSQL!
      await api.post('/users/add-balance', { amount });

      setSuccess(true);
      if (fetchUser) {
        await fetchUser();
      }
    } catch (err) {
      alert('Ошибка процессинга платежа. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setCardNumber('');
    setExpiry('');
    setCvv('');
    setCardName('');
    setCustomAmount('');
    setSelectedAmount(3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Page Description */}
      <div>
        <h2 className="text-2xl font-black text-slate-100 mb-2">Оплата и Личный Кошелек</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Безопасное пополнение личного счета для моментального бронирования занятий. 1 занятие стоит от 1500 ₽.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Wallet Balance Column */}
        <div className="md:col-span-1 space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800/80 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-2">Ваш баланс</span>
            
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-black text-slate-100 tracking-tight">
                {(user?.balance ?? 0).toLocaleString()}
              </span>
              <span className="text-xl font-bold text-slate-400">₽</span>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-800/60">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Защита транзакций ЮKassa SSL</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Landmark size={14} className="text-slate-400" />
                <span>Быстрый возврат неиспользованных средств</span>
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="p-5 rounded-3xl bg-slate-900/20 border border-slate-800/40 text-xs text-slate-500 leading-relaxed">
            <p className="font-semibold text-slate-400 mb-1">Как это работает?</p>
            Вы пополняете баланс на любую сумму. При клике на кнопку «Забронировать» в календаре, стоимость занятия автоматически резервируется, а после завершения урока перечисляется преподавателю.
          </div>
        </div>

        {/* Payment Form Column */}
        <div className="md:col-span-2">
          {success ? (
            <div className="p-8 rounded-3xl bg-slate-900/30 border border-slate-800/80 backdrop-blur-xl shadow-2xl text-center space-y-6 animate-scale-up">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-100">Баланс пополнен!</h3>
                <p className="text-sm text-slate-400">
                  Сумма в размере <span className="font-bold text-slate-200">{getAmount().toLocaleString()} ₽</span> зачислена на ваш кошелек.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Вернуться к оплате
              </button>
            </div>
          ) : (
            <form onSubmit={handlePaymentSubmit} className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl shadow-2xl space-y-6">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 select-none">
                <CreditCard className="text-indigo-400" size={20} />
                Пополнение баланса (Тестовый эквайринг)
              </h3>

              {/* Amount Presets */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Выберите сумму</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[1500, 3000, 4500, 6000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmount('');
                      }}
                      className={`py-3 rounded-2xl text-sm font-bold border transition-all duration-300 cursor-pointer ${
                        selectedAmount === amount && !customAmount
                          ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/5'
                          : 'bg-slate-950/80 border-slate-800/60 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      }`}
                    >
                      {amount.toLocaleString()} ₽
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Или введите другую сумму (₽)</label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(0);
                  }}
                  placeholder="Например, 5000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm font-semibold"
                />
              </div>

              {/* Card Inputs Mock */}
              <div className="space-y-4 pt-4 border-t border-slate-800/60">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Детали банковской карты</label>
                
                <div>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="0000 0000 0000 0000"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm font-mono tracking-widest"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={expiry}
                    onChange={handleExpiryChange}
                    placeholder="ММ/ГГ"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm font-mono tracking-widest text-center"
                  />
                  <input
                    type="password"
                    value={cvv}
                    onChange={handleCvvChange}
                    placeholder="CVV"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm font-mono tracking-widest text-center"
                  />
                </div>

                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  placeholder="CARDHOLDER NAME"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm font-mono tracking-wider"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/15 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Обработка транзакции банком...
                  </>
                ) : (
                  <>
                    Оплатить {getAmount().toLocaleString()} ₽
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
