import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LichessOpeningTree from '../LichessOpeningTree';

// Mock the LichessOpeningService
jest.mock('../../services/LichessOpeningService', () => ({
  lichessOpeningService: {
    getOpeningMoves: jest.fn(),
    getOpeningStats: jest.fn(),
    getTopGames: jest.fn(),
    getRecentGames: jest.fn(),
  },
}));

const mockLichessOpeningService = require('../../services/LichessOpeningService').lichessOpeningService;

describe('LichessOpeningTree', () => {
  const mockOnMoveClick = jest.fn();
  const defaultProps = {
    currentFEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    onMoveClick: mockOnMoveClick,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockLichessOpeningService.getOpeningMoves.mockResolvedValue([]);
    mockLichessOpeningService.getOpeningStats.mockResolvedValue(null);
    mockLichessOpeningService.getTopGames.mockResolvedValue([]);
    mockLichessOpeningService.getRecentGames.mockResolvedValue([]);

    render(<LichessOpeningTree {...defaultProps} />);
    
    expect(screen.getByText('Loading opening data from Lichess...')).toBeInTheDocument();
  });

  it('renders opening moves when data is loaded', async () => {
    const mockMoves = [
      {
        uci: 'e2e4',
        san: 'e4',
        white: 1000,
        draws: 500,
        black: 800,
        averageRating: 1800,
      },
      {
        uci: 'd2d4',
        san: 'd4',
        white: 800,
        draws: 600,
        black: 600,
        averageRating: 1850,
      },
    ];

    const mockStats = {
      totalGames: 2300,
      averageRating: 1825,
      mostPopularMove: 'e4',
    };

    mockLichessOpeningService.getOpeningMoves.mockResolvedValue(mockMoves);
    mockLichessOpeningService.getOpeningStats.mockResolvedValue(mockStats);
    mockLichessOpeningService.getTopGames.mockResolvedValue([]);
    mockLichessOpeningService.getRecentGames.mockResolvedValue([]);

    render(<LichessOpeningTree {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('e4')).toBeInTheDocument();
      expect(screen.getByText('d4')).toBeInTheDocument();
      expect(screen.getByText('2,300 games')).toBeInTheDocument();
    });
  });

  it('handles move clicks correctly', async () => {
    const mockMoves = [
      {
        uci: 'e2e4',
        san: 'e4',
        white: 1000,
        draws: 500,
        black: 800,
        averageRating: 1800,
      },
    ];

    mockLichessOpeningService.getOpeningMoves.mockResolvedValue(mockMoves);
    mockLichessOpeningService.getOpeningStats.mockResolvedValue({});
    mockLichessOpeningService.getTopGames.mockResolvedValue([]);
    mockLichessOpeningService.getRecentGames.mockResolvedValue([]);

    render(<LichessOpeningTree {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('e4')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('e4'));

    expect(mockOnMoveClick).toHaveBeenCalledWith('e2', 'e4');
  });

  it('handles database selection', async () => {
    mockLichessOpeningService.getOpeningMoves.mockResolvedValue([]);
    mockLichessOpeningService.getOpeningStats.mockResolvedValue({});
    mockLichessOpeningService.getTopGames.mockResolvedValue([]);
    mockLichessOpeningService.getRecentGames.mockResolvedValue([]);

    render(<LichessOpeningTree {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Lichess Opening Explorer')).toBeInTheDocument();
    });

    const databaseSelect = screen.getByDisplayValue('Lichess Database');
    fireEvent.change(databaseSelect, { target: { value: 'masters' } });

    expect(databaseSelect).toHaveValue('masters');
  });

  it('shows player input when player database is selected', async () => {
    mockLichessOpeningService.getOpeningMoves.mockResolvedValue([]);
    mockLichessOpeningService.getOpeningStats.mockResolvedValue({});
    mockLichessOpeningService.getTopGames.mockResolvedValue([]);
    mockLichessOpeningService.getRecentGames.mockResolvedValue([]);

    render(<LichessOpeningTree {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Lichess Opening Explorer')).toBeInTheDocument();
    });

    const databaseSelect = screen.getByDisplayValue('Lichess Database');
    fireEvent.change(databaseSelect, { target: { value: 'player' } });

    expect(screen.getByPlaceholderText('Enter player name')).toBeInTheDocument();
  });

  it('handles errors gracefully', async () => {
    mockLichessOpeningService.getOpeningMoves.mockRejectedValue(new Error('API Error'));
    mockLichessOpeningService.getOpeningStats.mockRejectedValue(new Error('API Error'));
    mockLichessOpeningService.getTopGames.mockRejectedValue(new Error('API Error'));
    mockLichessOpeningService.getRecentGames.mockRejectedValue(new Error('API Error'));

    render(<LichessOpeningTree {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load opening data. Please try again.')).toBeInTheDocument();
    });
  });

  it('displays no data message when no moves are available', async () => {
    mockLichessOpeningService.getOpeningMoves.mockResolvedValue([]);
    mockLichessOpeningService.getOpeningStats.mockResolvedValue({});
    mockLichessOpeningService.getTopGames.mockResolvedValue([]);
    mockLichessOpeningService.getRecentGames.mockResolvedValue([]);

    render(<LichessOpeningTree {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('No opening data available for this position')).toBeInTheDocument();
    });
  });
});
