# Poocho AI – Frontend (Next.js 14 App Router + Tailwind)

```bash
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL (ApiBaseUrl from `npx sls info --verbose`)
npm run dev                        # http://localhost:3000
```

## Backend config
The backend is a Lambda Function URL (no API Gateway). Set `FRONTEND_ORIGIN=http://localhost:3000`
in the backend `.env` before `npx sls deploy` (used for the Lambda CORS and the S3 bucket CORS needed
for the browser PUT upload). For production, redeploy with your real domain.

## Features
- Upload PDF / DOCX / TXT (progress bar, status: Uploading -> Syncing Vectors -> Ready)
- Chat grounded in the student's documents, with citations grouped per document (pages + passages)
- **Document scope**: tick the files in the sidebar to search only those; all ready files are searched by default
- Greetings / small talk are answered without sources (the backend tags each answer: grounded / chat / notfound)
- Chat history is saved per student in the browser (localStorage) and survives refresh
- Delete a document (removes the file and its vectors)

## Structure
```
app/            layout.tsx, page.tsx (workspace + document scope state), globals.css
components/     Sidebar, FileUploader, DocumentList (checkboxes), ChatArea, MessageBubble,
                CitationBadge (one pill per document), EmptyState, StudentSwitcher, ThemeToggle, Logo
hooks/          useStudents (localStorage profiles), useDocuments (list + polling),
                useChat (per-student history in localStorage + sessionId)
lib/            api.ts (service layer), types.ts, utils.ts
```
