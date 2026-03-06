## Mirror Auth

Mirror Auth is an authentication service that combines a standard web auth flow with face verification.  
It has three main parts:

- **webApp**: Next.js app where users sign up, log in, manage apps, and complete the OAuth flow.
- **py-server**: FastAPI service that turns face images into embeddings and checks if they belong to the same person.
- **test-app**: Simple Express app that shows how another service can use Mirror Auth as an OAuth provider.

### Project structure

- **webApp**: Next.js 16 + React 19 app, main UI and API routes.
- **py-server**: Python API for face embedding generation.
- **test-app**: Example Node.js client that integrates with Mirror Auth.

### How authentication works (high level)

1. **User signs up / logs in** in the `webApp` (account pages).
2. The app can use **face images** and sends them to the Python server.
3. The **Python server** creates embeddings and checks that all images are of the same person.
4. The `webApp` stores and uses these embeddings and related data in **ChromaDB** as a vector database, so it can compare future login attempts against stored face data.
5. If everything is valid, the `webApp` issues an auth token (JWT, encrypted and signed).
6. A third-party app (like `test-app`) redirects the user to Mirror Auth, then receives a token and can log the user in.

---

## 1. Web application (`webApp`)

### What it does

- **User accounts** (signup, login).
- **Dashboard** for logged-in users (for example managing applications).
- **OAuth provider** behavior:
  - Generates client id / secret for apps.
  - Redirects back with a token for the client app.
- Uses:
  - **MongoDB** (via `mongoose`) for users, apps, and tokens.
  - **ChromaDB** (via `chromadb`) as a vector database.
  - **Face API** in the browser (`face-api.js`) plus the Python service for embeddings.

### Important environment variables

Set these in `webApp/.env` (see `webApp/.env.example` for reference):

- **PYTHON_SERVER_URL**: URL of the face embedding backend, for example `http://localhost:3003`.
- **CHROMA_CLIENT_HOST**: Host of your ChromaDB instance, for example `localhost`.
- **CHROMA_CLIENT_PORT**: Port for ChromaDB, for example `8000`.
- **CHROMA_CLIENT_DB**: Database name used for both MongoDB and ChromaDB.
- **FACE_THRESHOLD**: Minimum similarity score to treat two faces as the same person (for example `0.70`).
- **JWT_SECRET_KEY**: Secret key for signing JWTs.
- **AES_SECRET_KEY**: Secret key for encrypting tokens.

Make sure MongoDB and ChromaDB are reachable using these values.

### Install and run `webApp`

From the project root:

```bash
cd webApp
npm install
npm run dev
```

By default Next.js runs on port `3000` (for example `http://localhost:3000`).

The routing middleware in `webApp/proxy.js` (used as Next.js middleware) makes sure:

- Unauthenticated users are redirected to `/account/login` when they try to open `/dashboard`.
- Logged-in users are redirected away from login and signup pages (except when using `appId` and `redirectURI` in the URL).

---

## 2. Python face embedding server (`py-server`)

### What it does

- Exposes a FastAPI endpoint:
  - `POST /generate` with one or more image files.
  - Saves images temporarily in an `upload` folder.
  - Uses `facenet-pytorch` (`MTCNN` and `InceptionResnetV1`) to:
    - Detect a single face per image.
    - Reject images with no face or multiple faces.
  - Computes embeddings for each valid image.
  - Checks cosine similarity between all embeddings.
    - If any pair is below a configured threshold, treats them as different people.
  - Returns a **single averaged embedding** if all images are valid and consistent.

On success it returns JSON like:

```json
{
  "success": true,
  "embeddings": [ /* array of numbers */ ]
}
```

On failure it returns:

```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```

### Likely Python dependencies

The server code uses the following libraries:

- `fastapi`
- `uvicorn`
- `numpy`
- `scikit-learn`
- `facenet-pytorch`
- `torch`
- `Pillow`

You can install them with:

```bash
pip install fastapi uvicorn numpy scikit-learn facenet-pytorch torch pillow
```

### Run `py-server`

From the project root:

```bash
cd py-server
python main.py
```

The FastAPI app runs with Uvicorn on host `0.0.0.0` and port `3003` by default.  
Set `PYTHON_SERVER_URL` in the `webApp` `.env` file to this URL.

---

## 3. Example client (`test-app`)

### What it does

`test-app` is a small Express application that shows how to act as an OAuth client for Mirror Auth.

- Uses `MirrorAuth` (from `mirrorAuth.js`) to:
  - Configure a provider with `clientId` and `clientSecret`.
  - Generate an auth link for the user.
  - Validate the token returned by Mirror Auth.
- Handles routes:
  - `GET /login`: redirects to Mirror Auth using the generated auth link.
  - `GET /auth/callback`: receives the `token` from Mirror Auth, validates it, then:
    - Signs a local JWT with `JWT_CRED`.
    - Stores it in an `AuthCookie` cookie.
  - `GET /`: reads the cookie and shows whether the user is logged in and their `fullName`.

### Environment variables for `test-app`

Create a `.env` file in `test-app` with at least:

- **OAUTH_CLIENT_ID**: Client id given by Mirror Auth.
- **OAUTH_CLIENT_SECRET**: Client secret given by Mirror Auth.
- **JWT_CRED**: Secret used to sign the local JWT stored in the cookie.

### Install and run `test-app`

From the project root:

```bash
cd test-app
npm install
node app.js
```

The app listens on `http://localhost:2200`.

---

## Typical local setup flow

1. **Start MongoDB and ChromaDB** on your machine.
2. **Configure `webApp/.env`** using `webApp/.env.example`.
3. **Start the Python server**:
   - `cd py-server`
   - `python main.py`
4. **Start the Next.js web app**:
   - `cd webApp`
   - `npm install`
   - `npm run dev`
5. **Configure and run `test-app`**:
   - Create a client app in the Mirror Auth dashboard and copy `clientId` and `clientSecret`.
   - Put them into `test-app/.env`.
   - `cd test-app`
   - `npm install`
   - `node app.js`
6. Open `http://localhost:2200/login` in the browser to test the full OAuth + face verification flow end to end.

---

## Notes and limitations

- The Python server expects **one clear face per image**. It will fail if it detects multiple faces or no face.
- All uploaded images in one request must belong to the **same person**, or the similarity check will fail.
- Be careful with your secret keys (`JWT_SECRET_KEY`, `AES_SECRET_KEY`, `JWT_CRED`); never commit real secrets to version control.
- This project is **not fully secure** and has several bugs. It does not protect all routes, it does not have rate limiting to protect against brute force attacks, and it may have XSS and other vulnerabilities.
- It is meant as a **learning example only**, to show how such a system can be built in a simple way.
- Do not use this code as-is in production. You can treat it as a small mini project for individual learning and experimentation.

