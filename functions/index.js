const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const cors = require("cors");

initializeApp();
const db = getFirestore();

const corsHandler = cors({ origin: true });

exports.createProduct = onRequest({ region: "us-central1" }, async (request, response) => {
    corsHandler(request, response, async () => {
        try {
            if (!request.headers.authorization) {
                return response.status(401).json({ error: "Unauthorized: Missing Authorization header" });
            }

            const idToken = request.headers.authorization.split("Bearer ")[1];
            const decodedToken = await getAuth().verifyIdToken(idToken);
            const uid = decodedToken.uid;

            const productData = { ...request.body, uid };
            const docRef = await db.collection("products").add(productData);
            const newDoc = await docRef.get();

            response.status(201).json({ id: newDoc.id, ...newDoc.data() });
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    });
});

exports.getAllProducts = onRequest({ region: "us-central1" }, async (request, response) => {
    corsHandler(request, response, async () => {
        try {
            const snapshot = await db.collection("products").get();
            const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            response.json(products);
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    });
});

exports.getAllProductsByUser = onRequest({ region: "us-central1" }, async (request, response) => {
    corsHandler(request, response, async () => {
        try {
            if (!request.headers.authorization) {
                return response.status(401).json({ error: "Unauthorized: Missing Authorization header" });
            }

            const idToken = request.headers.authorization.split("Bearer ")[1];
            const decodedToken = await getAuth().verifyIdToken(idToken);
            const uid = decodedToken.uid;

            const snapshot = await db.collection("products").where("uid", "==", uid).get();
            const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            response.json(products);
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    });
});

exports.getProductById = onRequest({ region: "us-central1" }, async (request, response) => {
    corsHandler(request, response, async () => {
        try {
            const id = request.url.replace(/^\/+|\/+$/g, '');
            const productRef = db.collection("products").doc(id);
            const productDoc = await productRef.get();

            if (!productDoc.exists) {
                return response.status(404).json({ error: "Product not found" });
            }

            response.json({ id: productDoc.id, ...productDoc.data() });
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    });
});

exports.updateProduct = onRequest({ region: "us-central1" }, async (request, response) => {
    corsHandler(request, response, async () => {
        try {
            const id = request.url.replace(/^\/+|\/+$/g, '');
            const data = request.body;
            const productRef = db.collection("products").doc(id);
            const productDoc = await productRef.get();

            if (!productDoc.exists) {
                return response.status(404).json({ error: "Product not found" });
            }

            await productRef.update(data);
            response.json({ id: productDoc.id, ...productDoc.data(), ...data });
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    });
});

exports.deleteProduct = onRequest({ region: "us-central1" }, async (request, response) => {
    corsHandler(request, response, async () => {
        try {
            const id = request.url.replace(/^\/+|\/+$/g, '');
            const productRef = db.collection("products").doc(id);
            const productDoc = await productRef.get();

            if (!productDoc.exists) {
                return response.status(404).json({ error: "Product not found" });
            }

            await productRef.delete();
            response.json({ message: `Product with id ${id} deleted successfully` });
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    });
});

exports.getAllOrdersByProductId = onRequest({ region: "us-central1" }, async (request, response) => {
    corsHandler(request, response, async () => {
        try {
            const productId = request.url.replace(/^\/+|\/+$/g, '');
            const snapshot = await db.collection("orders").where("productId", "==", productId).get();
            const productRef = db.collection("products").doc(productId);
            const productDoc = await productRef.get();
            if (!productDoc.exists) {
                return response.status(404).json({ error: "Product not found" });
            }
            const orders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                ...productDoc.data(),
            }));
            response.json(orders);
        } catch (error) {
            response.status(500).json({ error: error.message });
        }
    });
    exports.createOrder = onRequest({ region: "us-central1" }, async (request, response) => {
        try {
            const orderData = request.body;
            const newOrderData = {
                ...orderData,
                isAccepted: false,
                isFinished: false
            }
            const docRef = await db.collection("orders").add(newOrderData);
            const newDoc = await docRef.get();
            console.log("Order was created");
            response.json({ id: newDoc.id, ...newDoc.data() });
        } catch (error) {
            console.error(error);
            response.status(500).json({ error: error.message });
        }
    });

    exports.deleteOrderByUid = onRequest({ region: "us-central1" }, async (request, response) => {
        try {
            const orderId = request.path.split("/").filter(Boolean).pop();
            await db.collection("orders").doc(orderId).delete();
            console.log("Order deleted successfully by uid", orderId);
            response.json({ message: `Order deleted successfully` });
        } catch (error) {
            console.error(error);
            response.status(500).json({ error: error.message });
        }
    });

    exports.getAllOrdersWithProductsByUserUid = onRequest({ region: "us-central1" }, async (request, response) => {
        try {
            const ordersWithProducts = [];
            const userUid = request.path.split("/").filter(Boolean).pop();
            const orderList = await db.collection('orders')
                .where("userId", "==", userUid)
                .get();
            for (const orderDoc of orderList.docs) {
                const orderData = orderDoc.data();
                const productId = orderData.productId;

                const productDoc = await db.collection("products").doc(productId).get();
                const productData = productDoc.data();
                const orderWithProduct = {
                    orderId: orderDoc.id,
                    isAccepted: orderData.isAccepted,
                    isFinished: orderData.isFinished,
                    product: {
                        id: productDoc.id,
                        name: productData.name,
                        description: productData.description,
                        imageUrl: productData.imageUrl
                    }
                };
                ordersWithProducts.push(orderWithProduct);
            }
            console.log("Orders with products received");
            response.json(ordersWithProducts);
        } catch (error) {
            console.error(error);
            response.status(500).json({ error: error.message });
        }
    });

});
