const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();

exports.setCustomClaimForNewUser = functions.auth.user().onCreate(async (user) => {
    try {
        const listUsersResult = await admin.auth().listUsers();
        const isFirstUser = listUsersResult.users.length === 1;

        const claims = isFirstUser ? { role: 'admin' } : { role: 'user' };
        await admin.auth().setCustomUserClaims(user.uid, claims);

        console.log(`User ${user.uid} registered with role: ${claims.role}`);
    } catch (error) {
        console.error('Error assigning custom claims:', error);
    }
});
