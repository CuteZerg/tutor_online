'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Wallet, CreditCard, CheckCircle2, Loader2, Landmark, ShieldCheck, GraduationCap } from 'lucide-react';

interface Child {
  id: number;
  full_name: string;
  email: string;
  balance: number;
}

export default function ParentFinancesPage() {
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
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
  const [fetchLoading, setFetchLoading] = useState(true);

  const loadChildren = async () => {
    try {
      const res = await api.get('/users/children');
      setChildrenList(res.data);
      if (res.data.length > 0 && !selectedChildId) {
        setSelectedChildId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch children for finances', err);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  const getAmount = () => {
    if (customAmount) {
      return parseInt(customAmount, 10) || 0;
    }
    return selectedAmount;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 16);
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
    if (!selectedChildId) {
      alert('Пожалуйста, выберите ребенка для пополнения баланса');
      return;
    }

    const amount = getAmount();
    if (amount <= 0) {
      alert('Пожалуйста, выберите или введите корректную сумму');
      return;
    }

    setLoading(true);
    try {
      // Simulate bank delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Call backend add-balance with child student_id!
      await api.post('/users/add-balance', { 
        amount, 
        student_id: selectedChildId 
      });

      setSuccess(true);
      await loadChildren(); // Reload kids balance from PostgreSQL
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

  const selectedChild = childrenList.find(c => c.id === selectedChildId);

  if (fetchLoading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Page Description */}
      <div>
        <h2 className="text-2xl font-black text-slate-100 mb-2">Оплата обучения детей</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Удобное управление бюджетом и быстрое пополнение баланса занятий для ваших детей. Стоимость 1 занятия — 1500 ₽.
        </p>
      </div>

      {childrenList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Wallet Balance Column */}
          <div className="md:col-span-1 space-y-6">
            {/* Child selector & Balance Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800/80 shadow-2xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
              
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Выберите ребенка</label>
                <div className="flex flex-col gap-2">
                  {childrenList.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => {
                        setSelectedChildId(child.id);
                        handleReset();
                      }}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                        selectedChildId === child.id
                          ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300'
                          : 'bg-slate-950/80 border-slate-800/60 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      }`}
                    >
                      <GraduationCap size={14} />
                      {child.full_name}
                    </button>
                  ))}
                </div>
              </div>

              {selectedChild && (
                <div className="pt-4 border-t border-slate-800/60 space-y-1">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Текущий баланс ребенка</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-100 tracking-tight">
                      {selectedChild.balance.toLocaleString()}
                    </span>
                    <span className="text-lg font-bold text-slate-400">₽</span>
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t border-slate-800/60">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Защита транзакций ЮKassa SSL</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Landmark size={14} className="text-slate-400" />
                  <span>Моментальный возврат на карту</span>
                </div>
              </div>
            </div>

            {/* Quick Info Box */}
            <div className="p-5 rounded-3xl bg-slate-900/20 border border-slate-800/40 text-xs text-slate-500 leading-relaxed">
              <p className="font-semibold text-slate-400 mb-1">Информация об оплате</p>
              Вы можете выбрать любую сумму для пополнения личного счета ребенка. При бронировании слота в календаре, средства резервируются автоматически. Вы всегда можете отозвать платеж в личном кабинете.
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
                  <h3 className="text-2xl font-bold text-slate-100">Платеж проведен успешно!</h3>
                  <p className="text-sm text-slate-400">
                    Сумма в размере <span className="font-bold text-slate-200">{getAmount().toLocaleString()} ₽</span> успешно переведена на счет ребенка <span className="text-indigo-400 font-bold">{selectedChild?.full_name}</span>.
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
                  Тестовый эквайринг пополнения счета
                </h3>

                {/* Amount Presets */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Выберите сумму пополнения</label>
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
                            ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300'
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
      ) : (
        <div className="p-12 text-center rounded-3xl bg-slate-900/15 border border-slate-800/40 text-slate-500">
          У вас нет привязанных детей для оплаты обучения.
        </div>
      )}
    </div>
  );
}
