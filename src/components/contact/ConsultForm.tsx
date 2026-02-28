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
      <div className="bg-primary-50 p-8 rounded-2xl border border-primary-100 text-center">
        <h2 className="text-2xl font-bold text-primary-950">상담 신청이 정상적으로 완료되었습니다.</h2>
        <p className="mt-4 text-neutral-800">유통스타트 전문가들이 조만간 연락드리겠습니다. 감사합니다.</p>
        <button 
          onClick={() => setIsSuccess(false)}
          className="mt-8 bg-primary-950 hover:bg-primary-900 text-white font-bold py-3 px-8 rounded-lg"
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-neutral-100">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-neutral-700">담당자명 *</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required
              className="mt-2 w-full p-4 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              placeholder="홍길동"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-700">회사명 *</label>
            <input 
              type="text" 
              name="company" 
              value={formData.company} 
              onChange={handleChange} 
              required
              className="mt-2 w-full p-4 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              placeholder="유통스타트 컴퍼니"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-neutral-700">연락처 *</label>
            <input 
              type="tel" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              required
              className="mt-2 w-full p-4 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              placeholder="010-0000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-700">이메일</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              className="mt-2 w-full p-4 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              placeholder="example@email.com"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-neutral-700">관심 서비스</label>
          <select 
            name="serviceType" 
            value={formData.serviceType} 
            onChange={handleChange}
            className="mt-2 w-full p-4 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
          >
            <option value="utongstart">유통스타트 프로그램</option>
            <option value="live-commerce">라이브커머스 대행</option>
            <option value="place-seo">플레이스 상위노출</option>
            <option value="package">종합 패키지</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-neutral-700">상세 문의 내용</label>
          <textarea 
            name="message" 
            value={formData.message} 
            onChange={handleChange}
            rows={4}
            className="mt-2 w-full p-4 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
            placeholder="제조사 상황과 궁금하신 점을 자유롭게 남겨주세요."
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-primary-950 hover:bg-primary-900 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all"
        >
          {isSubmitting ? '신청 중...' : '무료 상담 신청하기'}
        </button>
      </form>
    </div>
  );
}
