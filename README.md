# NoteNote - 실시간 크로매틱 오디오 채보 도구

NoteNote는 마이크 입력 음성을 실시간으로 분석하여 오선보 악보로 시각화해 주는 고정밀 크로매틱 오디오 채보(Transcription) 도구입니다. 고급 주파수 감지 기술을 사용하여 입력된 오디오를 즉시 분석하고 악보로 변환합니다.

## 주요 기능

- **크로매틱 음정 감지**: 12반음(임시표 포함)을 정확하게 감지하여 채보
- **실시간 오선보 표시**: VexFlow 엔진을 사용하여 감지된 음을 실시간 오선보로 시각화
- **120 BPM 메트로놈**: 일관된 리듬 가이드를 위한 내장 메트로놈
- **시각적 피드백**: 재생 중 음표 실시간 하이라이트 표시
- **모던 UI**: Vite + Vanilla CSS 기반의 깔끔하고 반응형 디자인

## 기술 스택

- **Vite** - 차세대 프론트엔드 빌드 도구
- **VexFlow** - 악보 렌더링 엔진
- **Vanilla JavaScript** - 오디오 처리 및 핵심 로직
- **Vanilla CSS** - 커스텀 스타일링 및 애니메이션

## 빠른 시작

제공된 스크립트를 사용하여 개발 서버를 빠르게 실행할 수 있습니다:

- **macOS**: Finder에서 `start.command` 더블클릭
- **Windows**: 파일 탐색기에서 `start.bat` 더블클릭

스크립트가 자동으로 의존성을 설치하고 Vite 개발 서버를 실행합니다.

### 수동 설치

```bash
# 저장소 클론
git clone https://github.com/YuHyungmin1226/notenote.git
cd notenote

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 프로젝트 구조

```
notenote/
├── public/             # 정적 파일
├── src/                # 소스 코드
├── index.html          # 진입점
├── package.json        # Node.js 의존성
├── start.bat           # Windows 실행 스크립트
├── start.command       # macOS 실행 스크립트
└── README.md           # 프로젝트 문서
```

## 라이선스

MIT License
