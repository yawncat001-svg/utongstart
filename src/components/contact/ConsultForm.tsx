import React, { useState } from 'react';

export default function ConsultForm() {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    serviceType: 'utongstart',
    productCategory: 'food',
    budgetRange: 'under-300',
    message: '',
    referralSource: 'search'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // 실제 API 호출 로직은 여기에 구현합니다.
    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setIsSuccess(true);
      } else {
        alert('상담 신청에 실패했습니다. 다시 시도해 주세요.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('상담 신청에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-primary-50 p-12 rounded-[32px] border border-primary-100 text-center shadow-xl animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-accent-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-accent-500/20">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 className="text-3xl font-black text-primary-950 tracking-tighter">상담 신청 보관함에<br />안전하게 접수되었습니다!</h2>
        <p className="mt-6 text-body-lg text-neutral-600 leading-relaxed">
          유통스타트의 전문 컨설턴트가 사업자 정보를 검토한 후,<br />
          24시간 이내(영업일 기준)에 순차적으로 연락드리겠습니다.
        </p>
        <button
          onClick={() => setIsSuccess(false)}
          className="mt-10 bg-primary-950 hover:bg-primary-900 active:scale-95 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-xl"
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 md:p-12 rounded-[32px] shadow-2xl border border-neutral-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>

      <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-bold text-primary-950 ml-1">담당자명 <span className="text-accent-500">*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white focus:outline-none transition-all placeholder:text-neutral-400"
              placeholder="예: 홍길동"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-primary-950 ml-1">회사명 <span className="text-accent-500">*</span></label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
              className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white focus:outline-none transition-all placeholder:text-neutral-400"
              placeholder="예: (주)유통스타트"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-bold text-primary-950 ml-1">연락처 <span className="text-accent-500">*</span></label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white focus:outline-none transition-all placeholder:text-neutral-400"
              placeholder="010-0000-0000"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-primary-950 ml-1">이메일</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white focus:outline-none transition-all placeholder:text-neutral-400"
              placeholder="example@email.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-primary-950 ml-1">관심 서비스 <span className="text-accent-500">*</span></label>
          <div className="relative">
            <select
              name="serviceType"
              value={formData.serviceType}
              onChange={handleChange}
              className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white focus:outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="utongstart">유통스타트 프로그램 (추천)</option>
              <option value="live-commerce">라이브커머스 대행</option>
              <option value="place-seo">플레이스 상위노출</option>
              <option value="package">종합 패키지 문의</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-primary-950 ml-1">상세 문의 내용</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={5}
            className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white focus:outline-none transition-all placeholder:text-neutral-400 resize-none"
            placeholder="현재 제조중인 품목이나 유통상 겪고 계신 구체적인 어려움을 남겨주시면 더욱 심도 깊은 상담이 가능합니다."
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary-950 hover:bg-primary-900 disabled:bg-neutral-400 text-white font-black py-5 px-8 rounded-2xl text-xl transition-all shadow-xl shadow-primary-950/10 active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                처리 중입니다...
              </>
            ) : '무료 상담 신청하기'}
          </button>
          <p className="mt-6 text-center text-xs text-neutral-400 font-medium">
            전송과 동시에 유통스타트의 <span className="underline cursor-pointer">개인정보처리방침</span>에 동의하게 됩니다.
          </p>
        </div>
      </form>
    </div>
  );
}
