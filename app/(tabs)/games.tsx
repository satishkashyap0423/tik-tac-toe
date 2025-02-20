import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolateColor,
  useSharedValue,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 40, 300);
const CELL_SIZE = BOARD_SIZE / 3;

type Player = 'X' | 'O' | null;
type Board = Player[];
type WinLine = {
  start: number;
  end: number;
  angle: number;
  length: number;
} | null;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function Cell({ value, onPress, index, disabled }: { 
  value: Player; 
  onPress: () => void; 
  index: number;
  disabled: boolean;
}) {
  const { colors } = useTheme();
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSequence(
            withSpring(value ? 1.1 : 1),
            withSpring(value ? 1 : 1)
          ),
        },
      ],
      backgroundColor: withTiming(
        value 
          ? interpolateColor(
              index % 2,
              [0, 1],
              ['rgba(255, 43, 99, 0.1)', 'rgba(255, 43, 99, 0.2)']
            )
          : colors.overlay
      ),
    };
  }, [value, colors]);

  return (
    <AnimatedPressable
      style={[
        styles.cell,
        { borderColor: colors.border },
        animatedStyle
      ]}
      onPress={onPress}
      disabled={disabled || value !== null}>
      <Text style={[
        styles.cellText,
        { color: value === 'X' ? colors.primary : colors.secondary }
      ]}>
        {value}
      </Text>
    </AnimatedPressable>
  );
}

function WinningLine({ line }: { line: WinLine }) {
  const progress = useSharedValue(0);
  const { colors } = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    if (!line) return {};
    return {
      transform: [
        { translateX: line.start % 3 * CELL_SIZE + CELL_SIZE / 2 },
        { translateY: Math.floor(line.start / 3) * CELL_SIZE + CELL_SIZE / 2 },
        { rotate: `${line.angle}deg` },
        { scaleX: progress.value },
      ],
      opacity: progress.value,
    };
  }, [line]);

  if (!line) return null;

  progress.value = withSpring(1, { damping: 15 });

  return (
    <Animated.View
      style={[
        styles.winLine,
        {
          width: line.length,
          backgroundColor: colors.primary,
          transform: [
            { translateX: line.start % 3 * CELL_SIZE + CELL_SIZE / 2 },
            { translateY: Math.floor(line.start / 3) * CELL_SIZE + CELL_SIZE / 2 },
            { rotate: `${line.angle}deg` },
          ],
        },
        animatedStyle,
      ]}
    />
  );
}

function getWinningLine(board: Board): WinLine {
  const lines = [
    { cells: [0, 1, 2], angle: 0, length: BOARD_SIZE },
    { cells: [3, 4, 5], angle: 0, length: BOARD_SIZE },
    { cells: [6, 7, 8], angle: 0, length: BOARD_SIZE },
    { cells: [0, 3, 6], angle: 90, length: BOARD_SIZE },
    { cells: [1, 4, 7], angle: 90, length: BOARD_SIZE },
    { cells: [2, 5, 8], angle: 90, length: BOARD_SIZE },
    { cells: [0, 4, 8], angle: 45, length: BOARD_SIZE * 1.4 },
    { cells: [2, 4, 6], angle: 135, length: BOARD_SIZE * 1.4 },
  ];

  for (const line of lines) {
    const [a, b, c] = line.cells;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        start: a,
        end: c,
        angle: line.angle,
        length: line.length,
      };
    }
  }

  return null;
}

function checkWinner(board: Board): Player | 'draw' | null {
  const winLine = getWinningLine(board);
  if (winLine) {
    return board[winLine.start];
  }

  if (board.every(cell => cell !== null)) {
    return 'draw';
  }

  return null;
}

export default function GamesScreen() {
  const { colors } = useTheme();
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const winner = checkWinner(board);
  const winLine = getWinningLine(board);

  const handleCellPress = useCallback((index: number) => {
    if (board[index] === null && !winner) {
      const newBoard = [...board];
      newBoard[index] = currentPlayer;
      setBoard(newBoard);
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  }, [board, currentPlayer, winner]);

  const resetGame = useCallback(() => {
    if (winner && winner !== 'draw') {
      setScores(prev => ({
        ...prev,
        [winner]: prev[winner as keyof typeof prev] + 1,
      }));
    }
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
  }, [winner]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Tic Tac Toe</Text>

      <View style={[styles.scoreBoard, { backgroundColor: colors.surface }]}>
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, { color: colors.primary }]}>
            Player X
          </Text>
          <Text style={[styles.scoreNumber, { color: colors.primary }]}>
            {scores.X}
          </Text>
        </View>
        <View style={[styles.scoreDivider, { backgroundColor: colors.border }]} />
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, { color: colors.secondary }]}>
            Player O
          </Text>
          <Text style={[styles.scoreNumber, { color: colors.secondary }]}>
            {scores.O}
          </Text>
        </View>
      </View>
      
      <View style={styles.board}>
        {board.map((value, index) => (
          <Cell
            key={index}
            value={value}
            onPress={() => handleCellPress(index)}
            index={index}
            disabled={!!winner}
          />
        ))}
        <WinningLine line={winLine} />
      </View>

      <View style={styles.statusContainer}>
        {winner ? (
          <Text style={[styles.status, { color: colors.text }]}>
            {winner === 'draw' 
              ? "It's a draw!" 
              : `Player ${winner} wins!`}
          </Text>
        ) : (
          <Text style={[styles.status, { color: colors.text }]}>
            Player {currentPlayer}'s turn
          </Text>
        )}
        
        {winner && (
          <Pressable 
            style={[styles.resetButton, { backgroundColor: colors.primary }]}
            onPress={resetGame}>
            <Text style={styles.resetButtonText}>
              Play Again
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  scoreBoard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    borderRadius: 16,
    padding: 20,
  },
  scoreContainer: {
    alignItems: 'center',
    flex: 1,
  },
  scoreDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 20,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  cellText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  winLine: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    transformOrigin: 'left',
  },
  statusContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  status: {
    fontSize: 24,
    marginBottom: 20,
  },
  resetButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});