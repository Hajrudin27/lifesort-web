import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'LifeSort — Dit liv, samlet ét sted';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #fff1f2 0%, #fafaf9 50%, #fffbeb 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 120,
            height: 120,
            borderRadius: 28,
            background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
            marginBottom: 40,
          }}
        >
          <span style={{ fontSize: 64, fontWeight: 700, color: 'white' }}>L</span>
        </div>
        <div style={{ display: 'flex', fontSize: 72, fontWeight: 700, color: '#1c1917' }}>
          LifeSort
        </div>
        <div style={{ display: 'flex', fontSize: 32, color: '#57534e', marginTop: 16 }}>
          Dit liv, samlet ét sted
        </div>
      </div>
    ),
    { ...size }
  );
}