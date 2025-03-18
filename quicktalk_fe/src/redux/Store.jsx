import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storageSession from "redux-persist/lib/storage/session"; // Use sessionStorage
import authReducer from "./authSlice"; // Import the auth reducer instead of userSlice
import chatReducer, { chatMiddleware } from "./chatSlice"; // Import the chat middleware

// Create a persist config using sessionStorage
const persistConfig = {
  key: "root",
  storage: storageSession,
  whitelist: ["auth", "chat"], // Changed 'user' to 'auth'
};

const rootReducer = combineReducers({
  auth: authReducer, // Changed from 'user: userReducer'
  chat: chatReducer, // Add the chat reducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types from redux-persist
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/REGISTER",
        ],
      },
    }).concat(chatMiddleware), // Add our custom chat middleware
});

export const persistor = persistStore(store);
