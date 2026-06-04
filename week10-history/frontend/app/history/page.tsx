'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from "@/store/authStore";
import { useScanStore, useAnalyzeStore } from "@/store/scanStore";
import { useRouter } from 'next/navigation';

// 파일명으로부터 가독성 있는 정보를 추출하는 헬퍼 함수
interface FileInfo {
  displayTimestamp: string;
  aimod: string;
  aimodInfo: string;
  scanType: string;
}

function parseFileName(file: string): FileInfo {
  const timestamp = file.replace('.json', '').replace(/_/g, ' ').replace(/-/g, ':');
  const parts = timestamp.split(' ');
  
  // 예외 방지용 안전 장치
  const displayTimestamp = parts[2] && parts[3] 
    ? `${parts[2]} ${parts[3].replace(/:/g, '-').replace(/ /g, '_')}`
    : file;

  const aimodInfo = file.split('_')[1];
  const aimod = aimodInfo === "0" ? "AI 분석" : "일반 분석";

  const scanInfo = parts[0];
  let scanType = "기타 분석";
  if (scanInfo === "1") scanType = "파일 분석";
  else if (scanInfo === "2") scanType = "깃헙 링크 분석";
  else if (scanInfo === "3") scanType = "코드 스니펫 분석";

  return { displayTimestamp, aimod, aimodInfo, scanType };
}

export default function HistoryPage() {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const setAnalyzeResults = useAnalyzeStore((state) => state.setAnalyzeResults);
  const setResults = useScanStore((state) => state.setResults);
  const router = useRouter();
  
  const user = useAuthStore((state) => state.user);
  const userId = user ? user.id : "";
  const name = user ? user.name : "";

  useEffect(() => {
    if (!userId) return;
    
    const fetchHistoryFiles = async () => {
      try {
        const res = await axios.get(`/history/data?user_id=${userId}`);
        setFiles(res.data.files || []);
      } catch (err) {
        console.error("히스토리 목록을 가져오는데 실패했습니다.", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryFiles();
  }, [userId]);

  // 클릭 이벤트 핸들러
  const handleItemClick = async (file: string, aimodInfo: string) => {
    try {
      const res = await axios.get(`/history/data?user_id=${userId}&filename=${file}`);
      
      if (aimodInfo === "0") {
        setAnalyzeResults(res.data.content.raw_results);
        setResults(res.data.content.normal_results);
        router.push(`/report`);
      } else {
        // 일반 분석(aimodInfo === "1")일 때의 리포트 이동 로직이 필요하다면 여기에 추가
        alert("일반 분석 결과 페이지로 이동 로직을 확인하세요.");
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    }
  };

  // 1. 로딩 상태 뷰
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', fontSize: '16px', color: '#666', fontWeight: 500 }}>
        <div className="spinner" style={{ marginRight: '10px' }}>⏳</div> 로딩 중입니다...
      </div>
    );
  }

  return (
    <main style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* 헤더 섹션 */}
      <header style={{ marginBottom: '32px', borderBottom: '1px solid #e5e7eb', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          이용 내역 <span style={{ fontSize: '18px', fontWeight: 400, color: '#6b7280', marginLeft: '8px' }}>History</span>
        </h1>
        <p style={{ fontSize: '15px', color: '#4b5563', margin: 0 }}>
          <strong style={{ color: '#2563eb' }}>{name || '사용자'}</strong> 님의 최근 보안 스캔 기록 목록입니다.
        </p>
      </header>
      
      {/* 리스트 섹션 */}
      {files.length === 0 ? (
        // 2. 빈 상태(Empty State) 뷰
        <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px dashed #d1d5db', color: '#6b7280' }}>
          <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>📂</span>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>저장된 히스토리 기록이 없습니다.</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#9ca3af' }}>새로운 코드를 스캔해 보세요.</p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {files.map((file, index) => {
            const { displayTimestamp, aimod, aimodInfo, scanType } = parseFileName(file);
            const isAi = aimodInfo === "0";

            return (
              <li
                key={index}
                onClick={() => handleItemClick(file, aimodInfo)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'between',
                  padding: '18px 24px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                // 마우스 호버 효과 디자인 모킹 (CSS가 없다면 인라인으로 간접 처리 가능)
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                }}
              >
                {/* 왼쪽 콘텐츠: 시간 및 아이콘 */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '18px' }}>⏰</span>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#374151' }}>
                    {displayTimestamp}
                  </span>
                </div>

                {/* 오른쪽 콘텐츠: 배지 묶음 */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* 스캔 타입 배지 */}
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: '20px',
                    backgroundColor: '#f3f4f6',
                    color: '#4b5563'
                  }}>
                    {scanType}
                  </span>

                  {/* AI 여부 배지 */}
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: '20px',
                    backgroundColor: isAi ? '#eff6ff' : '#f0fdf4',
                    color: isAi ? '#2563eb' : '#16a34a',
                    border: isAi ? '1px solid #bfdbfe' : '1px solid #bbf7d0'
                  }}>
                    {aimod}
                  </span>
                  
                  {/* 화살표 아이콘 */}
                  <span style={{ color: '#9ca3af', marginLeft: '4px', fontSize: '14px' }}>❯</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}