# 배포 API 연동 점검 — 2026-10-29

## 확인한 근거

- 배포 서버 OpenAPI: https://jeonggyul.duckdns.org/v3/api-docs
- Swagger: https://jeonggyul.duckdns.org/swagger-ui/index.html
- 실제 HTTPS 명세를 다운로드해 확인. 로컬 백엔드 소스나 과거 계획을 배포 완료 근거로 사용하지 않음.
- 인증 쿠키 없는 읽기 점검: `/regions`, `/groups/1/settlements`, `/groups/1/join-requests` 모두 HTTP 401. 그룹 1의 존재나 회원 권한을 확인한 결과는 아님.

## 이번에 연결한 화면

`VITE_DATA_SOURCE=api`에서 적용. 로컬 모드는 기존 로컬 데이터와 작업을 유지한다.

- 모임 상세: GET `/groups/{groupId}`. 서버 이름·소개·장소·대표 이미지를 표시. 요청 실패 시 오류와 재시도. 응답에 현재 회원 수가 없어 샘플 회원 수는 숨김.
- 정산 목록: GET `/groups/{groupId}/settlements`. 전체/진행/종료/취소 필터, 20개 페이지 조회.
- 정산 상세: GET `/groups/{groupId}/settlements/{settlementId}`. 저장된 청구 금액과 회원별 PENDING/PAID/REFUNDED/CANCELLED 상태 표시. 조회 결과를 로컬 납부 완료로 바꾸지 않음.
- 가입 신청 관리: 대기 목록 페이지 조회, 승인, 선택 거절 사유(최대 500자). 확인 화면과 중복 클릭 방지, 서버 성공 이후 목록 재조회.
- 공통 클라이언트의 인증 쿠키·CSRF·오류 처리를 사용. API 실패를 로컬 성공으로 대체하지 않음.

## 생성 전 남은 의존성

정산 생성과 분할 미리보기의 서비스 함수는 최신 요청/응답 타입으로 준비했다. 화면에서는 모임 회원 목록 API가 준비될 때까지 서버 정산 생성 진입을 안내로 대체했다. 로컬 작성/OCR은 로컬 모드에서 계속 동작한다.

- 대상은 계정 memberId가 아닌 `group_member.id`다. 로컬 샘플 `member-1` 등의 값을 전송하지 않는다.
- EQUAL: totalAmount + groupMemberIds. CUSTOM: totalAmount + memberAmounts. 사용하지 않는 목록은 생략한다.
- 서버의 나머지 배분은 대상 ID 오름차순이다. 로컬 선택 순서의 계산을 서버 최종 청구액으로 간주하지 않는다.
- 생성은 중복 방지를 제공하지 않으므로 실제 작성 UI 연결 시 중복 클릭/응답 유실 후 재전송 방지가 필요하다.

## 현재 명세에 없는 항목

- 내 모임 목록/모임 검색/모임 회원 목록
- 일정 CRUD·참석·시간표 응답 공유 API
- 채팅·사진 전송 API
- 청구 납부 상태 변경/독촉 발송 API

홈의 모임 목록은 여전히 로컬 데이터다. 현재 명세로는 로그인 사용자의 실제 모임 목록을 자동으로 채울 수 없다. API 모드 상세는 카드의 ID로 서버를 조회하므로 샘플 ID는 403/404가 될 수 있으며 오류를 그대로 보여준다. 실제 서버에서 생성한 모임 ID 또는 접근 권한이 있는 ID로 검증해야 한다.

가입 신청의 Create/Detail/Created 등 일반 이름은 Swagger에서 그룹 스키마와 이름이 충돌한다. 이번에는 별도 스키마가 명확한 PendingList/Item과 승인·거절 계약을 사용했다. 내 신청 조회/신규 신청은 충돌하는 응답 타입을 임의 추정해 연결하지 않았다.

## 검증 범위

- `node scripts/check-api-contracts.mjs`: 모의 fetch로 URL, 쿼리, 서버 응답 해제, 쿠키, CSRF, 승인/거절 본문, EQUAL/CUSTOM 요청 분리, 403 전파 확인.
- TypeScript 검사 및 production build 실행. 빌드의 기존 단일 청크 크기 경고는 별도 최적화 대상.
- 실제 서버의 쓰기 요청(정산 생성·가입 승인·거절)은 실행하지 않았다. 실제 인증/권한을 가진 계정으로 성공 흐름 확인이 필요하다.
- 백엔드 수정, 커밋, 푸시, 배포는 수행하지 않았다.
