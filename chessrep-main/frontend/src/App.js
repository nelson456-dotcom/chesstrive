import React from 'react';
import { DndProvider } from 'react-dnd';
import MultiBackend, { multiBackendOptions } from './utils/dndBackendConfig';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// App component with all routes
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PropTypes from 'prop-types';

// Import all page components
import HomePage from './components/HomePage';
import MainContent from './components/MainContent';
import LessonsPage from './components/LessonsPage';
import PricingPage from './components/PricingPage';
import AboutUsPage from './components/AboutUsPage';
import ContactsPage from './components/ContactsPage';
import OpeningsPage from './components/OpeningsPage';
import OpeningDetailsPage from './components/OpeningDetailsPage';
import OpeningTreePage from './components/OpeningTreePage';
import OpeningBookPage from './components/OpeningBookPage';
import CoursePage from './components/CoursePage';
import GameAnalysisPage from './components/GameAnalysisPage';
import LiveAnalysisBoard from './components/LiveAnalysisBoard';
import SimpleBoardPage from './components/SimpleBoardPage';
import Login from './components/Login';
import Signup from './components/Signup';
import ProfilePage from './components/ProfilePage';
import PuzzleThemesPage from './components/PuzzleThemesPage';
import PuzzleSolvePage from './components/PuzzleSolvePage';
import PuzzleRushPage from './components/PuzzleRushPage';
import EndgameTrainerPage from './components/EndgameTrainerPage';
import EndgameTrainerIntroPage from './components/EndgameTrainerIntroPage';
import BlunderPreventerPage from './components/BlunderPreventerPage';
import BlunderPreventerIntroPage from './components/BlunderPreventerIntroPage';
import PuzzleRushIntroPage from './components/PuzzleRushIntroPage';
import PuzzleTrainerIntroPage from './components/PuzzleTrainerIntroPage';
import PositionalTrainerIntroPage from './components/PositionalTrainerIntroPage';
import GuessTheMoveIntroPage from './components/GuessTheMoveIntroPage';
import PlayWithBotIntroPage from './components/PlayWithBotIntroPage';
import AdvantageCapitalisationIntroPage from './components/AdvantageCapitalisationIntroPage';
import PracticeVisualisationIntroPage from './components/PracticeVisualisationIntroPage';
import PracticeVisualisationPage from './components/PracticeVisualisationPage';
import EnhancedChessStudyIntroPage from './components/EnhancedChessStudyIntroPage';
import GuessTheMovePage from './components/GuessTheMovePage';
import GameViewerPage from './components/GameViewerPage';
import AdvantageCapitalisationPage from './components/AdvantageCapitalisationPage';
import ResourcefulnessPage from './components/ResourcefulnessPage';
import DefenderPage from './components/DefenderPage';
import DefenderIntroPage from './components/DefenderIntroPage';
import PremiumRoute from './components/PremiumRoute';
import UpgradePage from './components/UpgradePage';
import PlayWithBotPage from './components/PlayWithBotPage';
import BotSelectionPage from './components/BotSelectionPage';
import BotGamePage from './components/BotGamePage';
import ChessAnnotationPage from './components/ChessAnnotationPage';
import ChessAnnotationAdvancedPage from './components/ChessAnnotationAdvancedPage';
import AnalysisPage from './components/AnalysisPage';
import BoardEditorPage from './components/BoardEditorPage';
import BoardEditorTest from './components/BoardEditorTest';
import ChessBoardEditor from './components/ChessBoardEditor';
import ChessStudyPage from './components/ChessStudyPage';
import EnhancedChessStudyPage from './components/EnhancedChessStudyPage';
import PGNAnalyzer from './components/PGNAnalyzer';
import ChessUpgradeLogoShowcase from './components/ChessUpgradeLogoShowcase';
import InteractiveChessBoard from './components/InteractiveChessBoard';
import ChessGameWithVariations from './components/ChessGameWithVariations';
import ChessAnalysisBoard from './components/ChessAnalysisBoard.jsx';
import CleanChessAnalysis from './components/CleanChessAnalysis.jsx';
import FortyGameReportPage from './components/FortyGameReportPage';
import PeerComparisonPage from './components/PeerComparisonPage';
import TestPGNTransfer from './components/TestPGNTransfer';
import ChessStudyViewer from './components/ChessStudyViewer';
import TestChessStudyViewer from './components/TestChessStudyViewer';
import ChessBoardPage from './pages/ChessBoardPage';
import ChessNotationEditor from './pages/ChessNotationEditor';
import SimplifiedChessBoardPage from './components/SimplifiedChessBoardPage';
import EnhancedSimplifiedChessBoardPage from './components/EnhancedSimplifiedChessBoardPage';
import EnhancedChessStudyWithSimplifiedBoard from './components/EnhancedChessStudyWithSimplifiedBoard';
import StudiesPage from './components/StudiesPage';
import DashboardHome from './components/DashboardHome';
import FeedPage from './components/FeedPage';
import ForumPage from './components/ForumPage';
import ForumTopicPage from './components/ForumTopicPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import TermsOfServicePage from './components/TermsOfServicePage';
import CookiePolicyPage from './components/CookiePolicyPage';
import RefundPolicyPage from './components/RefundPolicyPage';
import DMCAPolicyPage from './components/DMCAPolicyPage';
import FAQPage from './components/FAQPage';
import CommunityGuidelinesPage from './components/CommunityGuidelinesPage';
import AccessibilityStatementPage from './components/AccessibilityStatementPage';
import Navbar from './components/Navbar';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/" />;
  }
  
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};

const AppContent = () => {
  return (
      <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16">
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardHome />
              </ProtectedRoute>
            } 
          />
          <Route path="/main" element={<MainContent />} />
          <Route path="/lessons" element={<LessonsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/contact" element={<ContactsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/cookie-policy" element={<CookiePolicyPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
          <Route path="/dmca-policy" element={<DMCAPolicyPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/community-guidelines" element={<CommunityGuidelinesPage />} />
          <Route path="/accessibility" element={<AccessibilityStatementPage />} />
          <Route 
            path="/openings" 
            element={
              <ProtectedRoute>
                <OpeningsPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/opening/:id" element={<OpeningDetailsPage />} />
          <Route path="/opening-tree" element={<OpeningTreePage />} />
          <Route path="/opening-book" element={<OpeningBookPage />} />
          <Route path="/course/:courseId" element={<CoursePage />} />
          <Route path="/analyze" element={<GameAnalysisPage />} />
          <Route path="/live-analysis" element={<LiveAnalysisBoard />} />
          <Route path="/simple-board" element={<SimpleBoardPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/feed" 
            element={
              <ProtectedRoute>
                <FeedPage />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/forum" 
            element={
              <ProtectedRoute>
                <ForumPage />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/forum/:topicId" 
            element={
              <ProtectedRoute>
                <ForumTopicPage />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/puzzles" 
            element={
              <ProtectedRoute>
                <PuzzleThemesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/puzzles/:theme" 
            element={
              <ProtectedRoute>
                <PuzzleSolvePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/puzzles/random"
            element={
              <ProtectedRoute>
                <PuzzleSolvePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/puzzle-rush" 
            element={
              <ProtectedRoute>
                <PuzzleRushPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/endgame-trainer-intro" 
            element={
              <ProtectedRoute>
                <EndgameTrainerIntroPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/endgame-trainer" 
            element={
              <ProtectedRoute>
                <EndgameTrainerPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/blunder-preventer" 
            element={
              <ProtectedRoute>
                <PremiumRoute>
                  <BlunderPreventerPage />
                </PremiumRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chess-annotation" 
            element={
              <ProtectedRoute>
                <ChessAnnotationPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chess-annotation-advanced" 
            element={
              <ProtectedRoute>
                <ChessAnnotationAdvancedPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/board-editor" 
            element={
              <ProtectedRoute>
                <BoardEditorPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/board-editor-test" 
            element={
              <ProtectedRoute>
                <BoardEditorTest />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chess-board-editor" 
            element={
              <ProtectedRoute>
                <ChessBoardEditor />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/studies" 
            element={
              <ProtectedRoute>
                <StudiesPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/chess-study" element={<ChessStudyPage />} />
          <Route path="/enhanced-chess-study" element={<EnhancedChessStudyWithSimplifiedBoard />} />
          <Route 
            path="/enhanced-chess-study/:studyId" 
            element={
              <ProtectedRoute>
                <EnhancedChessStudyWithSimplifiedBoard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chess-study/:studyId" 
            element={
              <ProtectedRoute>
                <EnhancedChessStudyWithSimplifiedBoard />
              </ProtectedRoute>
            } 
          />
          <Route path="/simplified-chess-board" element={<SimplifiedChessBoardPage />} />
          <Route path="/enhanced-simplified-chess-board" element={<EnhancedSimplifiedChessBoardPage />} />
          <Route path="/enhanced-chess-study-with-simplified-board" element={<EnhancedChessStudyWithSimplifiedBoard />} />
          <Route path="/chess-study-viewer" element={<ChessStudyViewer />} />
          <Route path="/pgn-analyzer" element={<PGNAnalyzer />} />
          <Route path="/interactive-board" element={<InteractiveChessBoard />} />
          <Route path="/chess-game" element={<ChessGameWithVariations />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/chess-analysis-board" element={<CleanChessAnalysis />} />
          <Route path="/clean-chess-analysis" element={<CleanChessAnalysis />} />
          <Route path="/old-chess-analysis-board" element={<ChessAnalysisBoard />} />
          <Route 
            path="/report/:id" 
            element={
              <ProtectedRoute>
                <FortyGameReportPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/report/peer-comparison" 
            element={
              <ProtectedRoute>
                <PeerComparisonPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/test-pgn" element={<TestPGNTransfer />} />
          <Route path="/test-study-viewer" element={<TestChessStudyViewer />} />
          <Route path="/chess-board-demo" element={<ChessBoardPage />} />
          <Route path="/chess-notation-editor" element={<ChessNotationEditor />} />
          <Route path="/simplified-chess-board" element={<SimplifiedChessBoardPage />} />
          
          {/* Main Training Pages */}
          <Route 
            path="/practice-visualisation" 
            element={
              <ProtectedRoute>
                <PremiumRoute>
                  <PracticeVisualisationPage />
                </PremiumRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/guess-the-move" 
            element={
              <ProtectedRoute>
                <GuessTheMovePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/game-viewer" 
            element={
              <ProtectedRoute>
                <GameViewerPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/advantage-capitalisation" 
            element={
              <ProtectedRoute>
                <PremiumRoute>
                  <AdvantageCapitalisationPage />
                </PremiumRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/resourcefulness" 
            element={
              <ProtectedRoute>
                <PremiumRoute>
                  <ResourcefulnessPage />
                </PremiumRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/upgrade" 
            element={
              <ProtectedRoute>
                <UpgradePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bot-selection" 
            element={
              <ProtectedRoute>
                <BotSelectionPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bot-game" 
            element={
              <ProtectedRoute>
                <BotGamePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/play-with-bot" 
            element={
              <ProtectedRoute>
                <PlayWithBotPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Intro Pages */}
          <Route 
            path="/puzzle-rush-intro" 
            element={
              <ProtectedRoute>
                <PuzzleRushIntroPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/puzzle-trainer-intro" 
            element={
              <ProtectedRoute>
                <PuzzleTrainerIntroPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/blunder-preventer-intro" 
            element={
              <ProtectedRoute>
                <BlunderPreventerIntroPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/positional-trainer-intro" 
            element={
              <ProtectedRoute>
                <PositionalTrainerIntroPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/guess-the-move-intro" 
            element={
              <ProtectedRoute>
                <GuessTheMoveIntroPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/play-with-bot-intro" 
            element={
              <ProtectedRoute>
                <PlayWithBotIntroPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/advantage-capitalisation-intro" 
            element={
              <ProtectedRoute>
                <AdvantageCapitalisationIntroPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/defender-intro" 
            element={
              <ProtectedRoute>
                <DefenderIntroPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/defender" 
            element={
              <ProtectedRoute>
                <DefenderPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/practice-visualisation-intro" 
            element={
              <ProtectedRoute>
                <PracticeVisualisationIntroPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/enhanced-chess-study-intro" 
            element={
              <ProtectedRoute>
                <EnhancedChessStudyIntroPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/logo-showcase" element={<ChessUpgradeLogoShowcase />} />
          </Routes>
        </main>
      </div>
      </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <DndProvider backend={MultiBackend} options={multiBackendOptions}>
        <AppContent />
      </DndProvider>
    </AuthProvider>
  );
};

export default App;
