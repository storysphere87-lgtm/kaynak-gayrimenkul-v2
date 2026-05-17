'use client';

import React, { useState } from 'react';

interface OfferBotProps {
  propertyId: string;
  listPrice: number;
}

export default function OfferBot({ propertyId, listPrice }: OfferBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [offerAmount, setOfferAmount] = useState<number>(listPrice);
  const [messages, setMessages] = useState<any[]>([
    { sender: 'bot', text: 'Merhaba! Ben Kaynak Gayrimenkul Quantum AI Lüks Konut Müzakerecisiyim. Bu benzersiz portföyümüz için size özel fiyat teklifi çalışmamı ister misiniz? Lütfen bana isminizi iletin.' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const startNegotiation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setStep(2);
    setMessages(prev => [
      ...prev,
      { sender: 'bot', text: `Memnun oldum Sayın ${name}. Bu kıymetli portföyün liste fiyatı ${listPrice.toLocaleString('tr-TR')} TL. Sizin bu mülk için düşündüğünüz bütçe veya fiyat teklifi nedir? Aşağıdaki panelden teklif tutarınızı ayarlayıp bana mesaj atabilirsiniz.` }
    ]);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !offerAmount) return;

    const userMsg = inputText || `Teklifim: ${offerAmount.toLocaleString('tr-TR')} TL`;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');
    setLoading(true);

    try {
      const res = await fetch('/api/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          message: userMsg,
          offerAmount,
          name,
          phone,
          history: messages
        })
      });

      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
      } else {
        throw new Error();
      }
    } catch (e) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Müzakere servisimizde geçici bir yoğunluk var. Ancak teklifiniz ve bilgileriniz lüks konut danışmanımıza VIP öncelikle iletildi. En kısa sürede aranacaksınız.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-10 right-10 z-[999] print:hidden">
      
      {/* FLOATING TRIGGER BUTTON */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-gray-950 px-8 py-5 rounded-full font-bold shadow-2xl flex items-center gap-3 transition-all hover:scale-105 border border-yellow-400/30"
        >
          <span className="text-lg">🤖</span>
          <span className="text-xs uppercase tracking-widest font-black">AI Müzakereci</span>
        </button>
      )}

      {/* CHAT CONTAINER */}
      {isOpen && (
        <div className="bg-gray-900/95 border border-white/10 w-[380px] md:w-[420px] h-[550px] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-10 duration-300">
          
          {/* Header */}
          <div className="bg-gray-950 p-6 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
              <div>
                <h4 className="font-bold text-white text-sm">Quantum Müzakere OS</h4>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Neural OS v3.5 Online</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>
          </div>

          {/* Steps View */}
          {step === 1 ? (
            /* STEP 1: LEAD INFO COLLECTOR */
            <form onSubmit={startNegotiation} className="flex-1 p-8 flex flex-col justify-center gap-6">
              <div className="text-center">
                <span className="text-4xl mb-4 block">💼</span>
                <h5 className="font-serif text-white text-lg font-bold mb-2">Ön Müzakere Yetkilendirmesi</h5>
                <p className="text-gray-400 text-xs leading-relaxed">Fiyat teklifinizi mülk sahibine resmi protokol ile sunabilmemiz için iletişim bilgilerinizi giriniz.</p>
              </div>

              <div className="space-y-4">
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Adınız Soyadınız" 
                  required
                  className="w-full bg-gray-950 border border-white/10 p-4 rounded-xl text-white text-sm outline-none focus:border-yellow-600 transition-all"
                />
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="Telefon Numaranız" 
                  required
                  className="w-full bg-gray-950 border border-white/10 p-4 rounded-xl text-white text-sm outline-none focus:border-yellow-600 transition-all"
                />
              </div>

              <button 
                type="submit" 
                className="bg-yellow-600 hover:bg-yellow-500 text-gray-950 font-bold py-4 rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Müzakereyi Başlat
              </button>
            </form>
          ) : (
            /* STEP 2: ACTIVE AI NEGOTIATION CHAT */
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((m, i) => (
                  <div 
                    key={i} 
                    className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-semibold leading-relaxed ${
                      m.sender === 'user' 
                        ? 'bg-yellow-600 text-gray-950 rounded-tr-none' 
                        : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 text-gray-400 p-4 rounded-2xl rounded-tl-none text-xs font-bold animate-pulse">
                      Broker teklifinizi değerlendiriyor...
                    </div>
                  </div>
                )}
              </div>

              {/* Offer Tutar Slider */}
              <div className="bg-gray-950/80 p-4 border-t border-white/5 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span>Teklif Tutarınız:</span>
                  <span className="text-yellow-500 text-xs">{offerAmount.toLocaleString('tr-TR')} TL</span>
                </div>
                <input 
                  type="range" 
                  min={listPrice * 0.7} 
                  max={listPrice * 1.1} 
                  step={50000}
                  value={offerAmount} 
                  onChange={e => setOfferAmount(Number(e.target.value))}
                  className="w-full accent-yellow-600 bg-gray-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Chat Input */}
              <form onSubmit={sendMessage} className="p-4 bg-gray-950 border-t border-white/5 flex gap-2">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Mesajınızı veya talebinizi yazın..."
                  className="flex-1 bg-gray-900 border border-white/10 px-4 py-3 rounded-xl text-white text-xs outline-none focus:border-yellow-600 transition-all"
                />
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-yellow-600 hover:bg-yellow-500 text-gray-950 font-bold px-6 rounded-xl text-xs transition-all"
                >
                  Gönder
                </button>
              </form>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
