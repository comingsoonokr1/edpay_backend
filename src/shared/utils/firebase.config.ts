import admin from 'firebase-admin';

const serviceAccountJson = {
  type: "service_account",
  project_id: "edpay-4dd5a",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY!, // No need to replace here yet
  client_email: "firebase-adminsdk-fbsvc@edpay-4dd5a.iam.gserviceaccount.com",
  client_id: "101850283823019611478",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc@edpay-4dd5a.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// Replace the escaped \n with actual newlines ONLY here:
const serviceAccount = {
  projectId: serviceAccountJson.project_id,
  privateKey: serviceAccountJson.private_key.replace(/\\n/g, '\n'), 
  clientEmail: serviceAccountJson.client_email,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const firebaseAdmin = admin;
