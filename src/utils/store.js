// store.js
import { configureStore } from '@reduxjs/toolkit';
import usersReducer from './usersSlice'; // ✅ Correct import of default export
import userReducer from './userSlice'; // ✅ Correct import of default export

export const store = configureStore({
  reducer: {
    users: usersReducer,
    user: userReducer,
  },
});
