# 반응형 브레이크포인트 기준

## 현재 프로젝트에서 사용하는 브레이크포인트

### 1. 모바일 작은 (Small Mobile)
```css
@media screen and (max-width: 480px)
```
- **범위**: 0px ~ 480px
- **대상 디바이스**: 
  - iPhone SE (375px)
  - iPhone 12/13 mini (375px)
  - 작은 안드로이드 폰 (360px ~ 480px)
- **특징**: 
  - 가장 작은 화면 크기
  - 세로 레이아웃 중심
  - 터치 타겟 최소 44px
  - 폰트 크기 최소 14px

### 2. 모바일 큰 (Large Mobile)
```css
@media screen and (min-width: 481px) and (max-width: 767px)
```
- **범위**: 481px ~ 767px
- **대상 디바이스**:
  - iPhone 12/13/14 (390px)
  - iPhone 12/13/14 Pro Max (428px)
  - Galaxy S21/S22 (360px ~ 414px)
  - Pixel 5/6 (393px ~ 412px)
- **특징**:
  - 일반적인 스마트폰 크기
  - 여전히 세로 레이아웃
  - 약간 더 넓은 여백 가능

### 3. 태블릿 (Tablet)
```css
@media screen and (min-width: 768px) and (max-width: 1023px)
```
- **범위**: 768px ~ 1023px
- **대상 디바이스**:
  - iPad (768px)
  - iPad Mini (768px)
  - 작은 태블릿 (768px ~ 1023px)
- **특징**:
  - 가로/세로 레이아웃 모두 지원
  - 2열 레이아웃 가능
  - 더 넓은 패딩과 간격

### 4. 데스크톱 (Desktop)
```css
@media screen and (min-width: 1024px)
```
- **범위**: 1024px 이상
- **대상 디바이스**:
  - 노트북 (1024px ~ 1366px)
  - 데스크톱 모니터 (1280px ~ 1920px)
- **특징**:
  - 가로 레이아웃 중심
  - 멀티 컬럼 레이아웃
  - 호버 효과 활용

### 5. 대형 데스크톱 (Large Desktop)
```css
@media screen and (min-width: 1440px)
```
- **범위**: 1440px 이상
- **대상 디바이스**:
  - 대형 모니터 (1440px ~ 2560px)
  - 울트라와이드 모니터 (3440px 이상)
- **특징**:
  - 최대 너비 제한 (max-width) 설정 권장
  - 중앙 정렬 레이아웃
  - 더 넓은 간격과 여백

## 일반적인 모바일 반응형 기준 (업계 표준)

### Bootstrap 5 기준
- **xs (Extra Small)**: < 576px
- **sm (Small)**: ≥ 576px
- **md (Medium)**: ≥ 768px
- **lg (Large)**: ≥ 992px
- **xl (Extra Large)**: ≥ 1200px
- **xxl (XXL)**: ≥ 1400px

### Tailwind CSS 기준
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Material Design 기준
- **Mobile**: 0px ~ 599px
- **Tablet**: 600px ~ 959px
- **Desktop**: 960px 이상

### Apple Human Interface Guidelines
- **iPhone SE**: 375px
- **iPhone 12/13/14**: 390px
- **iPhone 12/13/14 Pro Max**: 428px
- **iPad**: 768px (세로), 1024px (가로)
- **iPad Pro**: 834px (세로), 1194px (가로)

## 현재 프로젝트의 브레이크포인트 사용 현황

### 주요 브레이크포인트
1. **480px**: 모바일 작은 화면
2. **481px ~ 767px**: 모바일 큰 화면
3. **768px ~ 1023px**: 태블릿
4. **1024px**: 데스크톱 시작
5. **1440px**: 대형 데스크톱

### 사용 패턴
- **모바일 우선 (Mobile First)**: `max-width` 사용
- **데스크톱 우선 (Desktop First)**: `min-width` 사용
- **현재 프로젝트**: 혼합 사용 (섹션별로 다름)

## 권장 사항

### 1. 모바일 세분화 (더 세밀한 제어가 필요한 경우)
```css
/* 초소형 모바일 */
@media screen and (max-width: 360px) { }

/* 작은 모바일 */
@media screen and (min-width: 361px) and (max-width: 480px) { }

/* 중간 모바일 */
@media screen and (min-width: 481px) and (max-width: 640px) { }

/* 큰 모바일 */
@media screen and (min-width: 641px) and (max-width: 767px) { }
```

### 2. 태블릿 세분화
```css
/* 작은 태블릿 (세로) */
@media screen and (min-width: 768px) and (max-width: 834px) { }

/* 중간 태블릿 */
@media screen and (min-width: 835px) and (max-width: 1023px) { }

/* 큰 태블릿 (가로) */
@media screen and (min-width: 1024px) and (max-width: 1194px) { }
```

### 3. 데스크톱 세분화
```css
/* 작은 데스크톱 */
@media screen and (min-width: 1024px) and (max-width: 1279px) { }

/* 중간 데스크톱 */
@media screen and (min-width: 1280px) and (max-width: 1439px) { }

/* 큰 데스크톱 */
@media screen and (min-width: 1440px) { }
```

## 실제 디바이스 크기 참고

### iPhone
- iPhone SE (2nd/3rd gen): 375px × 667px
- iPhone 12/13/14: 390px × 844px
- iPhone 12/13/14 Pro Max: 428px × 926px
- iPhone 14 Plus: 428px × 926px

### Android
- Galaxy S21/S22: 360px × 800px
- Pixel 5: 393px × 851px
- Pixel 6: 412px × 915px

### iPad
- iPad (9th/10th gen): 768px × 1024px (세로), 1024px × 768px (가로)
- iPad Mini: 768px × 1024px (세로), 1024px × 768px (가로)
- iPad Pro 11": 834px × 1194px (세로), 1194px × 834px (가로)
- iPad Pro 12.9": 1024px × 1366px (세로), 1366px × 1024px (가로)

## 결론

현재 프로젝트는 **5단계 브레이크포인트 체계**를 사용하고 있으며, 이는 대부분의 디바이스를 커버하기에 충분합니다. 더 세밀한 제어가 필요한 경우 위의 세분화 기준을 참고하여 추가 브레이크포인트를 도입할 수 있습니다.


