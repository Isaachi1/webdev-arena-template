import React, { useState, useEffect } from "react";
import {
  User,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { auth, db } from "../config/firebaseConfig";

interface Lesson {
  id: string;
  question: string;
  options: string[];
  correct: number;
  image: string;
  phrase: string;
  theme: "animals" | "food" | "travel";
}

interface UserData {
  stars: number;
  levels: {
    [key: string]: {
      completed: boolean;
      stars: number;
    };
  };
  lives: number;
  lastLogin: Date;
}

interface ChallengeResult {
  levelId: string;
  correct: boolean;
  selectedOption: number;
  correctAnswer: number;
  lives: number;
  stars: number;
}

const lessons: Lesson[] = [
  {
    id: "level-1",
    question: "What animal is this?",
    options: ["Dog", "Cat", "Bird", "Fish"],
    correct: 1,
    image:
      "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?q=80&w=2672&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    phrase: "This is a cat.",
    theme: "animals",
  },
  {
    id: "level-2",
    question: "What food is this?",
    options: ["Apple", "Pizza", "Burger", "Sushi"],
    correct: 0,
    image:
      "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    phrase: "This is an apple.",
    theme: "food",
  },
  {
    id: "level-3",
    question: "What place is this?",
    options: ["Beach", "City", "Mountain", "Forest"],
    correct: 2,
    image:
      "https://images.unsplash.com/photo-1480497490787-505ec076689f?q=80&w=2500&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    phrase: "This is a mountain.",
    theme: "travel",
  },
];

export const Schema = {
  "commentary": "This is a language learning web app with a map-based progression and interactive lesson challenges.",
  "template": "nextjs-developer",
  "title": "Language Quest",
  "description": "A web app for learning languages with interactive challenges and map-based progression.",
  "additional_dependencies": [
    "framer-motion"
  ],
  "has_additional_dependencies": true,
  "install_dependencies_command": "npm install framer-motion",
  "port": 3000,
  "file_path": "pages/index.tsx",
  "code": "<see code above>"
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          } else {
            const initialUserData: UserData = {
              stars: 0,
              levels: {},
              lives: 5,
              lastLogin: new Date(),
            };
            await setDoc(userRef, initialUserData);
            setUserData(initialUserData);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      setError("");
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError("Invalid email or password");
    }
  };

  const handleSignup = async () => {
    try {
      setError("");
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError("Error creating account");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
      setCurrentLevel(0);
      setShowResult(false);
      setResult(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleSelectOption = (index: number) => {
    setSelectedOption(index);
  };

  const handleSubmit = async () => {
    if (selectedOption === null) return;

    const currentLesson = lessons[currentLevel];
    const isCorrect = selectedOption === currentLesson.correct;

    const newLives = isCorrect ? Number(userData?.lives) : (userData?.lives || 1) - 1;
    const newStars = isCorrect
      ? (userData?.stars || 0) + 1
      : userData?.stars || 0;

    const result: ChallengeResult = {
      selectedOption,
      lives: newLives,
      stars: newStars,
      correct: isCorrect,
      levelId: currentLesson.id,
      correctAnswer: currentLesson.correct,
    };

    setResult(result);
    setShowResult(true);

    if (user && userData) {
      try {
        const userRef = doc(db, "users", user.uid);
        const updatedLevels = {
          ...userData.levels,
          [currentLesson.id]: {
            completed: true,
            stars: isCorrect ? 1 : 0,
          },
        };

        await setDoc(userRef, {
          ...userData,
          lives: newLives,
          stars: newStars,
          levels: updatedLevels,
          lastLogin: new Date(),
        });

        setUserData({
          ...userData,
          lives: newLives,
          stars: newStars,
          levels: updatedLevels,
        });
      } catch (error) {
        console.error("Error updating user data:", error);
      }
    }
  };

  const handleNextLevel = () => {
    if (currentLevel < lessons.length - 1) {
      setCurrentLevel(currentLevel + 1);
    } else {
      setCurrentLevel(0);
    }
    setSelectedOption(null);
    setShowResult(false);
    setResult(null);
  };

  const getProgress = () => {
    if (!userData) return 0;
    return Object.values(userData.levels).filter((level) => level.completed)
      .length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
            LinguaQuest
          </h1>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {user.email}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="px-4 py-2 border text-black border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="px-4 py-2 border text-black border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleLogin}
                className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                Login
              </button>
              <button
                type="button"
                onClick={handleSignup}
                className="px-4 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>

      {user && userData && (
        <div className="max-w-4xl mx-auto p-4 mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Your Progress
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-yellow-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-bold text-gray-800">
                    {userData.stars}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-pink-100 px-4 py-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-pink-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-bold text-gray-800">
                    {userData.lives}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${(getProgress() / lessons.length) * 100}%`,
                }}
                transition={{ duration: 0.8 }}
                style={{ width: `${(getProgress() / lessons.length) * 100}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-gray-500 text-right">
              {getProgress()}/{lessons.length} levels completed
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-green-100 p-3 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                Level {currentLevel + 1}
              </h2>
            </div>

            <div className="mb-6">
              <div className="aspect-video w-full rounded-xl overflow-hidden mb-4">
                <img
                  src={lessons[currentLevel].image}
                  alt="Lesson"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xl text-gray-700 mb-4 font-medium">
                {lessons[currentLevel].question}
              </p>
              <div className="grid gap-3">
                {lessons[currentLevel].options.map((option, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => !showResult && handleSelectOption(index)}
                    className={`p-4 text-lg text-left rounded-xl transition-colors ${selectedOption === index
                      ? "bg-blue-500 text-white"
                      : showResult && index === lessons[currentLevel].correct
                        ? "bg-green-500 text-white"
                        : showResult &&
                          selectedOption === index &&
                          index !== lessons[currentLevel].correct
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-black hover:bg-gray-200"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {showResult &&
                        index === lessons[currentLevel].correct && (
                          <div className="bg-white p-1 rounded-full">
                            <Check className="h-5 w-5 text-green-500" />
                          </div>
                        )}
                      {showResult &&
                        selectedOption === index &&
                        index !== lessons[currentLevel].correct && (
                          <div className="bg-white p-1 rounded-full">
                            <X className="h-5 w-5 text-red-500" />
                          </div>
                        )}
                      <span>{option}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              {!showResult ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmit}
                  disabled={selectedOption === null}
                  className={`px-6 py-3 rounded-full text-white font-medium transition-colors ${selectedOption === null
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    }`}
                >
                  Check Answer
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextLevel}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium hover:from-green-600 hover:to-blue-600 transition-colors"
                >
                  {currentLevel < lessons.length - 1
                    ? "Next Level"
                    : "Play Again"}
                </motion.button>
              )}
            </div>

            <AnimatePresence>
              {showResult && result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-6 p-4 rounded-xl ${result.correct ? "bg-green-50" : "bg-red-50"}`}
                >
                  <p
                    className={`text-lg font-medium ${result.correct ? "text-green-700" : "text-red-700"}`}
                  >
                    {result.correct ? "Correct!" : "Try again!"}
                  </p>
                  <p className="text-gray-600 mt-1">
                    {result.correct
                      ? `You earned 1 star!`
                      : `The correct answer was: ${lessons[currentLevel].options[lessons[currentLevel].correct]}`}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
