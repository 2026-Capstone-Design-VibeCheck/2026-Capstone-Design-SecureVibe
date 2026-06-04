import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const filename = searchParams.get('filename'); // 💡 파일 내용 요청용 파라미터 추가

  if (!userId) {
    return NextResponse.json({ error: 'user_id가 필요합니다.' }, { status: 400 });
  }

  const targetDir = path.join(process.cwd(), 'app', 'history', 'data', userId);

  try {
    if (!fs.existsSync(targetDir)) {
      return NextResponse.json({ files: [], content: null });
    }

    // 🌟 case 1: filename이 주어졌다면 해당 파일의 실제 '내용'을 읽어서 반환
    if (filename) {
      const filePath = path.join(targetDir, filename);
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 });
      }
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      console.log("읽어온 파일 내용:", fileContent); // 💡 읽어온 내용 로그로 확인
      
      // 저장된 데이터가 JSON이므로 파싱해서 객체 형태로 돌려줍니다.
      return NextResponse.json({ content: JSON.parse(fileContent) });
    }

    // 🌟 case 2: filename이 없다면 기존처럼 '파일 목록'을 반환
    const files = fs.readdirSync(targetDir);
    return NextResponse.json({ files });
    
  } catch (err: any) {
    console.error('디렉토리/파일 읽기 실패:', err);
    return NextResponse.json({ error: '처리에 실패했습니다.' }, { status: 500 });
  }
}