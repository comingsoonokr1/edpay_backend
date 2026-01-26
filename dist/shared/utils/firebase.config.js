import admin from 'firebase-admin';
import serviceAccountJson from './edpay-4dd5a-firebase-adminsdk-fbsvc-f87e67dfb5.json';
const serviceAccount = {
    projectId: serviceAccountJson.project_id,
    privateKey: serviceAccountJson.private_key.replace(/\\n/g, '\n'), // Handle escaped newlines in private key
    clientEmail: serviceAccountJson.client_email,
};
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
export const firebaseAdmin = admin;
