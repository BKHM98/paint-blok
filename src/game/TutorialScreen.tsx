// Tutorial Screen for new players
import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { t } from '../i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TutorialScreenProps {
  onComplete: () => void;
  darkMode: boolean;
}

interface TutorialSlide {
  id: string;
  title: string;
  description: string;
  visual: 'goal' | 'paint' | 'shapes' | 'blocked' | 'tips';
}

const getSlides = (): TutorialSlide[] => [
  {
    id: '1',
    title: t('tutorial.welcome'),
    description: t('tutorial.welcomeDesc'),
    visual: 'goal',
  },
  {
    id: '2',
    title: t('tutorial.howToPaint'),
    description: t('tutorial.howToPaintDesc'),
    visual: 'paint',
  },
  {
    id: '3',
    title: t('tutorial.matchShapes'),
    description: t('tutorial.matchShapesDesc'),
    visual: 'shapes',
  },
  {
    id: '4',
    title: t('tutorial.obstacles'),
    description: t('tutorial.obstaclesDesc'),
    visual: 'blocked',
  },
  {
    id: '5',
    title: t('tutorial.tips'),
    description: t('tutorial.tipsDesc'),
    visual: 'tips',
  },
];

// Mini grid cell component
const MiniCell: React.FC<{
  color: string | null;
  blocked?: boolean;
  highlight?: boolean;
  darkMode: boolean;
}> = ({ color, blocked, highlight, darkMode }) => {
  const baseColor = darkMode ? '#2A2A4A' : '#E8E8E8';
  const borderColor = darkMode ? '#3A3A5A' : '#D0D0D0';

  if (blocked) {
    return (
      <View style={[styles.miniCell, { backgroundColor: darkMode ? '#1A1A2A' : '#D0D0D0' }]}>
        <Text style={[styles.blockedX, { color: darkMode ? '#4A4A6A' : '#A0A0A0' }]}>X</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.miniCell,
        {
          backgroundColor: color || baseColor,
          borderColor: highlight ? '#00F5D4' : borderColor,
          borderWidth: highlight ? 2 : 1,
        },
      ]}
    />
  );
};

// Visual demonstrations for each slide
const SlideVisual: React.FC<{ type: string; darkMode: boolean }> = ({ type, darkMode }) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'];

  switch (type) {
    case 'goal':
      // Show a completed 3x3 grid with L-shape
      return (
        <View style={styles.visualContainer}>
          <View style={styles.miniGrid}>
            {[
              [colors[0], colors[0], null],
              [colors[0], null, null],
              [null, null, null],
            ].map((row, r) => (
              <View key={r} style={styles.miniRow}>
                {row.map((color, c) => (
                  <MiniCell key={c} color={color} darkMode={darkMode} />
                ))}
              </View>
            ))}
          </View>
          <Text style={[styles.visualLabel, { color: darkMode ? '#AAA' : '#666' }]}>
            Create an L-shape!
          </Text>
        </View>
      );

    case 'paint':
      // Show finger dragging across cells
      return (
        <View style={styles.visualContainer}>
          <View style={styles.miniGrid}>
            {[
              [colors[1], colors[1], colors[1]],
              [null, null, colors[1]],
              [null, null, null],
            ].map((row, r) => (
              <View key={r} style={styles.miniRow}>
                {row.map((color, c) => (
                  <MiniCell key={c} color={color} highlight={r === 0} darkMode={darkMode} />
                ))}
              </View>
            ))}
          </View>
          <Text style={[styles.visualLabel, { color: darkMode ? '#AAA' : '#666' }]}>
            Drag to paint cells
          </Text>
        </View>
      );

    case 'shapes':
      // Show shape bank with required shapes
      return (
        <View style={styles.visualContainer}>
          <View style={styles.shapeBank}>
            <View style={styles.shapeBankItem}>
              <View style={styles.shapePreview}>
                {[[true, false], [true, false], [true, true]].map((row, r) => (
                  <View key={r} style={styles.shapeRow}>
                    {row.map((filled, c) => (
                      <View
                        key={c}
                        style={[
                          styles.shapeCell,
                          { backgroundColor: filled ? colors[0] : 'transparent' },
                        ]}
                      />
                    ))}
                  </View>
                ))}
              </View>
              <Text style={[styles.shapeCount, { color: darkMode ? '#FFF' : '#333' }]}>x2</Text>
            </View>
            <View style={styles.shapeBankItem}>
              <View style={styles.shapePreview}>
                {[[true, true], [true, true]].map((row, r) => (
                  <View key={r} style={styles.shapeRow}>
                    {row.map((filled, c) => (
                      <View
                        key={c}
                        style={[
                          styles.shapeCell,
                          { backgroundColor: filled ? colors[2] : 'transparent' },
                        ]}
                      />
                    ))}
                  </View>
                ))}
              </View>
              <Text style={[styles.shapeCount, { color: darkMode ? '#FFF' : '#333' }]}>x1</Text>
            </View>
          </View>
          <Text style={[styles.visualLabel, { color: darkMode ? '#AAA' : '#666' }]}>
            Shape bank shows required shapes
          </Text>
        </View>
      );

    case 'blocked':
      // Show grid with blocked cells
      return (
        <View style={styles.visualContainer}>
          <View style={styles.miniGrid}>
            {[
              [colors[3], null, false],
              [colors[3], false, null],
              [colors[3], colors[3], null],
            ].map((row, r) => (
              <View key={r} style={styles.miniRow}>
                {row.map((cell, c) => (
                  <MiniCell
                    key={c}
                    color={typeof cell === 'string' ? cell : null}
                    blocked={cell === false}
                    darkMode={darkMode}
                  />
                ))}
              </View>
            ))}
          </View>
          <Text style={[styles.visualLabel, { color: darkMode ? '#AAA' : '#666' }]}>
            X cells cannot be painted
          </Text>
        </View>
      );

    case 'tips':
      // Show boost icons
      return (
        <View style={styles.visualContainer}>
          <View style={styles.boostRow}>
            <View style={styles.boostItem}>
              <Text style={styles.boostIcon}>💡</Text>
              <Text style={[styles.boostLabel, { color: darkMode ? '#FFF' : '#333' }]}>Hint</Text>
            </View>
            <View style={styles.boostItem}>
              <Text style={styles.boostIcon}>⏱️</Text>
              <Text style={[styles.boostLabel, { color: darkMode ? '#FFF' : '#333' }]}>Time</Text>
            </View>
            <View style={styles.boostItem}>
              <Text style={styles.boostIcon}>⏭️</Text>
              <Text style={[styles.boostLabel, { color: darkMode ? '#FFF' : '#333' }]}>Skip</Text>
            </View>
          </View>
          <Text style={[styles.visualLabel, { color: darkMode ? '#AAA' : '#666' }]}>
            Use boosts when you need help
          </Text>
        </View>
      );

    default:
      return null;
  }
};

export const TutorialScreen: React.FC<TutorialScreenProps> = ({ onComplete, darkMode }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slides = useMemo(() => getSlides(), []);

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.5, duration: 100, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();

      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const skip = () => {
    onComplete();
  };

  const renderSlide = ({ item }: { item: TutorialSlide }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <SlideVisual type={item.visual} darkMode={darkMode} />
      <Text style={[styles.title, { color: darkMode ? '#FFF' : '#333' }]}>{item.title}</Text>
      <Text style={[styles.description, { color: darkMode ? '#AAA' : '#666' }]}>
        {item.description}
      </Text>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor:
                index === currentIndex
                  ? '#00F5D4'
                  : darkMode
                  ? '#3A3A5A'
                  : '#D0D0D0',
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <LinearGradient
      colors={darkMode ? ['#1A1A2E', '#16213E'] : ['#F8F9FA', '#E9ECEF']}
      style={styles.container}
    >
      <TouchableOpacity style={styles.skipButton} onPress={skip}>
        <Text style={[styles.skipText, { color: darkMode ? '#888' : '#999' }]}>{t('tutorial.skip')}</Text>
      </TouchableOpacity>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />
      </Animated.View>

      {renderDots()}

      <TouchableOpacity onPress={goToNext} activeOpacity={0.8}>
        <LinearGradient
          colors={['#00F5D4', '#00BBF9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.nextButton}
        >
          <Text style={styles.nextText}>
            {currentIndex === slides.length - 1 ? t('tutorial.letsPlay') : t('tutorial.next')}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 40,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  visualContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  miniGrid: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
  },
  miniRow: {
    flexDirection: 'row',
  },
  miniCell: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 8,
  },
  blockedX: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  visualLabel: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  shapeBank: {
    flexDirection: 'row',
    gap: 30,
    marginBottom: 15,
  },
  shapeBankItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 15,
    borderRadius: 12,
  },
  shapePreview: {
    marginBottom: 8,
  },
  shapeRow: {
    flexDirection: 'row',
  },
  shapeCell: {
    width: 20,
    height: 20,
    margin: 1,
    borderRadius: 4,
  },
  shapeCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  boostRow: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 15,
  },
  boostItem: {
    alignItems: 'center',
  },
  boostIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  boostLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  nextButton: {
    marginHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  nextText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TutorialScreen;
