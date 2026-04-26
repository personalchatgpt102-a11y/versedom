import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Bookshelf from "./pages/Bookshelf";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Library from "./pages/Library";
import BookChapters from "./pages/BookChapters";
import ReadChapter from "./pages/ReadChapter";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/bookshelf" replace />} />

        <Route
          path="/bookshelf"
          element={
            <ProtectedRoute>
              <Bookshelf />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="/library" element={<Library />} />
        <Route path="/books/:slug/chapters" element={<BookChapters />} />
        <Route path="/books/:slug/chapter/:chapter" element={<ReadChapter />} />
        <Route path="/bookshelf/:slug/chapters" element={<BookChapters />} />
        <Route path="/novel/:slug/chapter/:chapter" element={<ReadChapter />} />
        <Route path="*" element={<Navigate to="/bookshelf" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
