const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

exports.createProduct = onRequest({ region: "us-central1" }, async (request, response) => {
    const docRef = await db.collection("products").add(request.body);
    const newDoc = await docRef.get();
    const createdItem = { id: newDoc.id, ...newDoc.data() };
    response.json( createdItem );
});

exports.getAllProducts = onRequest({ region: "us-central1" }, async (request, response) => {
    const snapshot = await db.collection("products").get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    response.json(products);
});

exports.getProductById = onRequest({ region: "us-central1" }, async (request, response) => {
    const id = request.url.replace(/^\/+|\/+$/g, '');
    const productRef = db.collection("products").doc(id);
    const productDoc = await productRef.get();
    response.json({ id: productDoc.id, ...productDoc.data() });
});

exports.updateProduct = onRequest({ region: "us-central1" }, async (request, response) => {
    const id = request.url.replace(/^\/+|\/+$/g, '');
    const data = request.body;
    const productRef = db.collection("products").doc(id);
    const productDoc = await productRef.get();
    await productRef.update(data);
    const updatedProduct = { id: productDoc.id, ...productDoc.data(), ...data };
    response.json(updatedProduct);
});

exports.deleteProduct = onRequest({ region: "us-central1" }, async (request, response) => {
    const id = request.url.replace(/^\/+|\/+$/g, '');
    const productRef = db.collection("products").doc(id);
    await productRef.delete();
    response.json(`Product with id ${id} deleted successfully`);
});
