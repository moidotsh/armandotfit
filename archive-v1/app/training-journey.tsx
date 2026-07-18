import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { YStack, Text, XStack } from 'tamagui';
import { Svg, Path, Rect, Circle, G, Defs, LinearGradient as SvgLinearGradient, Stop, Polygon, Text as SvgText, Ellipse, Pattern, Image, Filter, FeDropShadow } from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// World dimensions - adjusted for ConstrainedView and mobile-first
const WORLD_WIDTH = Math.min(screenWidth, 600);
const WORLD_HEIGHT = 2400; // Increased height for better vertical journey

// Create a tile size for consistent pattern design
const TILE_SIZE = 30;

// Define training levels/locations in the world - vertical path
// Adjusted positions for ConstrainedView
const WORLD_CENTER_X = WORLD_WIDTH / 2;
const levels = [
  { id: 1, name: "The Beginning", x: WORLD_CENTER_X, y: 200, unlocked: true, completed: true, theme: "meadow" },
  { id: 2, name: "Strength Foundation", x: WORLD_CENTER_X - 60, y: 400, unlocked: true, completed: true, theme: "forest" },
  { id: 3, name: "Endurance Valley", x: WORLD_CENTER_X + 60, y: 650, unlocked: true, completed: false, theme: "river" },
  { id: 4, name: "Power Summit", x: WORLD_CENTER_X, y: 900, unlocked: true, completed: false, theme: "mountain" },
  { id: 5, name: "Athletic Plateau", x: WORLD_CENTER_X + 80, y: 1150, unlocked: false, completed: false, theme: "highland" },
  { id: 6, name: "Advanced Territory", x: WORLD_CENTER_X, y: 1400, unlocked: false, completed: false, theme: "canyon" },
  { id: 7, name: "Elite Realm", x: WORLD_CENTER_X - 80, y: 1650, unlocked: false, completed: false, theme: "peak" },
  { id: 8, name: "Master Domain", x: WORLD_CENTER_X + 60, y: 1900, unlocked: false, completed: false, theme: "summit" },
  { id: 9, name: "Champion's Peak", x: WORLD_CENTER_X, y: 2150, unlocked: false, completed: false, theme: "celestial" },
];

// Define paths between levels with creative routing
const paths = [
  { from: 1, to: 2, type: "curved" },
  { from: 2, to: 3, type: "river" },
  { from: 3, to: 4, type: "mountain" },
  { from: 4, to: 5, type: "bridge" },
  { from: 5, to: 6, type: "canyon" },
  { from: 6, to: 7, type: "cliff" },
  { from: 7, to: 8, type: "peak" },
  { from: 8, to: 9, type: "final" },
];

export default function TrainingJourney() {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const scrollY = new Animated.Value(0);

  const handleLevelPress = (levelId: number) => {
    const level = levels.find(l => l.id === levelId);
    if (level && level.unlocked) {
      setSelectedLevel(levelId);
      // Navigate to workout session with this level
      router.push(`/workout-detail?level=${levelId}`);
    }
  };

  // Create tile pattern components for different terrain types
  const renderTilePatterns = () => (
    <Defs>
      {/* Sky gradient that changes as you descend */}
      <SvgLinearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#dbeafe" />
        <Stop offset="30%" stopColor="#bfdbfe" />
        <Stop offset="70%" stopColor="#7dd3fc" />
        <Stop offset="100%" stopColor="#0284c7" />
      </SvgLinearGradient>
      
      {/* Water gradient for rivers and lakes */}
      <SvgLinearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#67e8f9" />
        <Stop offset="100%" stopColor="#0891b2" />
      </SvgLinearGradient>
      
      {/* Stone gradient for mountains and caves */}
      <SvgLinearGradient id="stoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#94a3b8" />
        <Stop offset="50%" stopColor="#64748b" />
        <Stop offset="100%" stopColor="#475569" />
      </SvgLinearGradient>
      
      {/* Celestial gradient for the final area */}
      <SvgLinearGradient id="celestialGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#fbbf24" />
        <Stop offset="50%" stopColor="#f59e0b" />
        <Stop offset="100%" stopColor="#d97706" />
      </SvgLinearGradient>
      
      {/* Tree patterns for forests */}
      <Pattern id="treePattern" x="0" y="0" width={TILE_SIZE * 2} height={TILE_SIZE * 2} patternUnits="userSpaceOnUse">
        <Circle cx={TILE_SIZE} cy={TILE_SIZE} r={TILE_SIZE * 0.8} fill="#15803d" opacity="0.8"/>
      </Pattern>
      
      {/* Grass pattern for meadows */}
      <Pattern id="grassPattern" x="0" y="0" width={TILE_SIZE} height={TILE_SIZE} patternUnits="userSpaceOnUse">
        <Rect width={TILE_SIZE} height={TILE_SIZE} fill="#22c55e" opacity="0.4"/>
        <Rect x={TILE_SIZE * 0.3} y={TILE_SIZE * 0.5} width={TILE_SIZE * 0.1} height={TILE_SIZE * 0.5} fill="#16a34a" opacity="0.6"/>
        <Rect x={TILE_SIZE * 0.6} y={TILE_SIZE * 0.3} width={TILE_SIZE * 0.1} height={TILE_SIZE * 0.7} fill="#16a34a" opacity="0.6"/>
      </Pattern>
      
      {/* Rock pattern for mountains */}
      <Pattern id="rockPattern" x="0" y="0" width={TILE_SIZE * 2} height={TILE_SIZE * 2} patternUnits="userSpaceOnUse">
        <Polygon points={`${TILE_SIZE},${TILE_SIZE * 0.3} ${TILE_SIZE * 1.7},${TILE_SIZE} ${TILE_SIZE * 0.3},${TILE_SIZE}`} fill="#6b7280" opacity="0.7"/>
      </Pattern>
      
      {/* Star pattern for celestial area */}
      <Pattern id="starPattern" x="0" y="0" width={TILE_SIZE * 3} height={TILE_SIZE * 3} patternUnits="userSpaceOnUse">
        {Array.from({ length: 5 }).map((_, i) => (
          <Circle
            key={i}
            cx={Math.random() * TILE_SIZE * 3}
            cy={Math.random() * TILE_SIZE * 3}
            r={Math.random() * 3 + 1}
            fill="white"
            opacity={Math.random() * 0.7 + 0.3}
          />
        ))}
      </Pattern>
      
      {/* Shadow filter for depth */}
      <Filter id="shadow">
        <FeDropShadow dx={2} dy={2} stdDeviation={3} floodOpacity={0.3} />
      </Filter>
    </Defs>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Training Journey",
          headerStyle: {
            backgroundColor: "#1a202c",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />
      
      <YStack flex={1} backgroundColor="#1a202c" maxWidth={WORLD_WIDTH} width="100%" alignSelf="center">
        {/* Header with gradient background */}
        <View style={styles.headerGradient}>
          <YStack padding="$4" borderBottomWidth={1} borderColor="#475569">
            <Text fontSize={28} fontWeight="bold" color="#f1f5f9">
              Your Training World
            </Text>
            <Text fontSize={16} color="#cbd5e1" marginTop="$2">
              🏃‍♂️ Journey through fitness realms
            </Text>
            <Text fontSize={14} color="#94a3b8" marginTop="$1">
              Tap on unlocked levels to begin your journey
            </Text>
          </YStack>
        </View>

        {/* World Map View */}
        <ScrollView
          showsVerticalScrollIndicator={true}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          contentContainerStyle={{ 
            width: WORLD_WIDTH,
            height: WORLD_HEIGHT,
            backgroundColor: '#0f172a'
          }}
          minimumZoomScale={0.8}
          maximumZoomScale={2}
        >
          <View style={styles.worldContainer}>
            <Svg
              width={WORLD_WIDTH}
              height={WORLD_HEIGHT}
              style={styles.svgWorld}
            >
              {/* Render the tile patterns */}
              {renderTilePatterns()}
              
              {/* Sky background with deeper colors */}
              <Rect width={WORLD_WIDTH} height={WORLD_HEIGHT} fill="url(#skyGradient)" />
              
              {/* Animated stars in the sky */}
              {Array.from({ length: 50 }).map((_, i) => {
                const size = Math.random() * 2 + 1;
                const x = Math.random() * WORLD_WIDTH;
                const y = Math.random() * WORLD_HEIGHT;
                const opacity = Math.random() * 0.8 + 0.2;
                return (
                  <Circle
                    key={`star-${i}`}
                    cx={x}
                    cy={y}
                    r={size}
                    fill="white"
                    opacity={opacity}
                  />
                );
              })}
              
              {/* Layered terrain zones for vertical journey */}
              
              {/* Meadow Zone (Top) - Using ConstrainedView center */}
              <Ellipse 
                cx={WORLD_CENTER_X} 
                cy="200" 
                rx={WORLD_WIDTH * 0.9} 
                ry="120" 
                fill="#86efac" 
                opacity="0.6" 
              />
              {/* Grass tiles */}
              <Rect 
                x="0" 
                y="100" 
                width={WORLD_WIDTH} 
                height="150" 
                fill="url(#grassPattern)" 
              />
              {/* Detailed meadow elements */}
              {Array.from({ length: 8 }).map((_, i) => {
                const x = Math.random() * WORLD_WIDTH;
                const y = 120 + Math.random() * 80;
                const size = Math.random() * 15 + 10;
                return (
                  <Ellipse
                    key={`meadow-${i}`}
                    cx={x}
                    cy={y}
                    rx={size}
                    ry={size * 0.8}
                    fill="#22c55e"
                    opacity={0.4}
                  />
                );
              })}
              
              {/* Forest Zone - More detailed trees */}
              <Path
                d={`M 0,350 Q ${WORLD_CENTER_X},380 ${WORLD_WIDTH},350 L ${WORLD_WIDTH},500 Q ${WORLD_CENTER_X},530 0,500 Z`}
                fill="#15803d"
                opacity="0.7"
              />
              {/* Forest with pattern */}
              <Rect 
                x="0" 
                y="320" 
                width={WORLD_WIDTH} 
                height="200" 
                fill="url(#treePattern)" 
              />
              {/* Individual detailed trees */}
              {Array.from({ length: 12 }).map((_, i) => {
                const x = Math.random() * WORLD_WIDTH;
                const y = 380 + Math.random() * 80;
                const size = Math.random() * 15 + 15;
                return (
                  <G key={`tree-${i}`}>
                    <Ellipse
                      cx={x}
                      cy={y - size * 0.6}
                      rx={size * 0.8}
                      ry={size * 0.6}
                      fill="#15803d"
                      opacity="0.9"
                    />
                    <Rect
                      x={x - size * 0.15}
                      y={y - size * 0.2}
                      width={size * 0.3}
                      height={size * 0.4}
                      fill="#7c2d12"
                    />
                  </G>
                );
              })}
              
              {/* River Valley - More organic shape */}
              <Path
                d={`M ${WORLD_CENTER_X - 80},600 Q ${WORLD_CENTER_X - 60},650 ${WORLD_CENTER_X},700 Q ${WORLD_CENTER_X + 60},750 ${WORLD_CENTER_X + 80},800 L ${WORLD_CENTER_X + 80},850 Q ${WORLD_CENTER_X + 60},880 ${WORLD_CENTER_X},900 Q ${WORLD_CENTER_X - 60},920 ${WORLD_CENTER_X - 80},950 Z`}
                fill="url(#waterGradient)"
                opacity="0.7"
              />
              {/* River flow details */}
              {Array.from({ length: 5 }).map((_, i) => {
                const startX = WORLD_CENTER_X + Math.sin(i * 0.5) * 60;
                const startY = 650 + i * 60;
                const cpX = WORLD_CENTER_X + Math.sin(i * 0.5 + 1) * 40;
                const cpY = startY + 30;
                const endX = WORLD_CENTER_X + Math.sin(i * 0.5 + 2) * 60;
                const endY = startY + 60;
                return (
                  <Path
                    key={`river-${i}`}
                    d={`M ${startX},${startY} Q ${cpX},${cpY} ${endX},${endY}`}
                    stroke="#0ea5e9"
                    strokeWidth="4"
                    fill="none"
                    opacity="0.6"
                  />
                );
              })}
              
              {/* Mountain Base - More dramatic peaks */}
              <Path
                d={`M 0,950 L ${WORLD_CENTER_X - 100},750 L ${WORLD_CENTER_X + 100},950 L ${WORLD_WIDTH},950 L ${WORLD_WIDTH},1150 L ${WORLD_CENTER_X + 150},1000 L 0,1150 Z`}
                fill="url(#stoneGradient)"
                opacity="0.8"
              />
              {/* Rock pattern on mountain */}
              <Rect 
                x="0" 
                y="900" 
                width={WORLD_WIDTH} 
                height="250" 
                fill="url(#rockPattern)" 
              />
              {/* Mountain peaks with snow caps */}
              <G>
                <Path d={`M ${WORLD_CENTER_X - 60},950 L ${WORLD_CENTER_X - 40},850 L ${WORLD_CENTER_X - 20},950 Z`} fill="#e2e8f0" />
                <Path d={`M ${WORLD_CENTER_X + 20},950 L ${WORLD_CENTER_X + 40},820 L ${WORLD_CENTER_X + 60},950 Z`} fill="#e2e8f0" />
                <Path d={`M ${WORLD_CENTER_X},900 L ${WORLD_CENTER_X + 20},800 L ${WORLD_CENTER_X + 40},900 Z`} fill="#e2e8f0" />
              </G>
              
              {/* Highland Plateau - Floating islands effect */}
              <G>
                <Ellipse 
                  cx={WORLD_CENTER_X + 80} 
                  cy="1200" 
                  rx="120" 
                  ry="60" 
                  fill="#a78bfa" 
                  opacity="0.7" 
                />
                <Ellipse 
                  cx={WORLD_CENTER_X - 60} 
                  cy="1250" 
                  rx="100" 
                  ry="50" 
                  fill="#8b5cf6" 
                  opacity="0.6" 
                />
                {/* Waterfalls */}
                <Path 
                  d={`M ${WORLD_CENTER_X + 80},1260 Q ${WORLD_CENTER_X + 90},1300 ${WORLD_CENTER_X + 100},1340`} 
                  stroke="#60a5fa" 
                  strokeWidth="3" 
                  fill="none" 
                  opacity="0.7" 
                />
              </G>
              
              {/* Canyon Zone - Dramatic depth */}
              <G>
                <Path
                  d={`M 50,1450 L ${WORLD_WIDTH - 50},1450 L ${WORLD_WIDTH - 100},1600 L 100,1600 Z`}
                  fill="#dc2626"
                  opacity="0.7"
                />
                <Path
                  d={`M 100,1600 L ${WORLD_WIDTH - 100},1600 L ${WORLD_WIDTH - 120},1750 L 120,1750 Z`}
                  fill="#b91c1c"
                  opacity="0.8"
                />
                {/* Canyon details */}
                {Array.from({ length: 8 }).map((_, i) => {
                  const x = 100 + (WORLD_WIDTH - 200) * Math.random();
                  const y = 1500 + Math.random() * 150;
                  return (
                    <Polygon
                      key={`canyon-${i}`}
                      points={`${x},${y} ${x + 10},${y - 20} ${x + 20},${y}`}
                      fill="#991b1b"
                      opacity="0.6"
                    />
                  );
                })}
              </G>
              
              {/* Summit Zone - Approaching the celestial realm */}
              <G>
                <Path d={`M ${WORLD_CENTER_X - 100},1800 L ${WORLD_CENTER_X},1700 L ${WORLD_CENTER_X + 100},1800 L ${WORLD_CENTER_X + 80},1900 L ${WORLD_CENTER_X - 80},1900 Z`} fill="#6366f1" />
                <Path d={`M ${WORLD_CENTER_X - 80},1900 L ${WORLD_CENTER_X},1820 L ${WORLD_CENTER_X + 80},1900 L ${WORLD_CENTER_X + 60},1970 L ${WORLD_CENTER_X - 60},1970 Z`} fill="#818cf8" />
                {/* Glowing crystals */}
                {Array.from({ length: 5 }).map((_, i) => {
                  const x = WORLD_CENTER_X + (Math.random() - 0.5) * 120;
                  const y = 1850 + Math.random() * 80;
                  return (
                    <Circle
                      key={`crystal-${i}`}
                      cx={x}
                      cy={y}
                      r="6"
                      fill="#fbbf24"
                      opacity="0.8"
                    />
                  );
                })}
              </G>
              
              {/* Celestial Peak (Bottom) - The final goal */}
              <G>
                {/* Outer glow */}
                <Circle 
                  cx={WORLD_CENTER_X} 
                  cy="2150" 
                  r="100" 
                  fill="url(#celestialGradient)" 
                  opacity="0.3" 
                />
                {/* Star pattern background */}
                <Rect 
                  x={WORLD_CENTER_X - 120} 
                  y="2050" 
                  width="240" 
                  height="200" 
                  fill="url(#starPattern)" 
                />
                {/* Main star */}
                <Circle 
                  cx={WORLD_CENTER_X} 
                  cy="2150" 
                  r="60" 
                  fill="#fbbf24" 
                  opacity="0.8" 
                />
                <Circle 
                  cx={WORLD_CENTER_X} 
                  cy="2150" 
                  r="40" 
                  fill="#f59e0b" 
                  opacity="0.9" 
                />
                {/* Star rays */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i * 30) * Math.PI / 180;
                  const x1 = WORLD_CENTER_X + Math.cos(angle) * 70;
                  const y1 = 2150 + Math.sin(angle) * 70;
                  const x2 = WORLD_CENTER_X + Math.cos(angle) * 100;
                  const y2 = 2150 + Math.sin(angle) * 100;
                  return (
                    <Path
                      key={`ray-${i}`}
                      d={`M ${x1},${y1} L ${x2},${y2}`}
                      stroke="#fbbf24"
                      strokeWidth="4"
                      opacity="0.9"
                    />
                  );
                })}
              </G>
              
              {/* Decorative clouds throughout journey - positioned for ConstrainedView */}
              <Ellipse cx="50" cy="180" rx="40" ry="15" fill="white" opacity="0.6" />
              <Ellipse cx={WORLD_WIDTH - 50} cy="320" rx="45" ry="18" fill="white" opacity="0.5" />
              <Ellipse cx="30" cy="520" rx="35" ry="12" fill="white" opacity="0.6" />
              <Ellipse cx={WORLD_WIDTH - 30} cy="720" rx="50" ry="20" fill="white" opacity="0.5" />
              <Ellipse cx="40" cy="980" rx="40" ry="15" fill="white" opacity="0.6" />
              <Ellipse cx={WORLD_WIDTH - 40} cy="1380" rx="45" ry="18" fill="white" opacity="0.5" />
              <Ellipse cx="20" cy="1680" rx="35" ry="12" fill="white" opacity="0.4" />
              <Ellipse cx={WORLD_WIDTH - 20} cy="1980" rx="50" ry="20" fill="white" opacity="0.4" />
              
              {/* Connecting paths with different styles based on terrain */}
              {paths.map((path, index) => {
                const fromLevel = levels.find(l => l.id === path.from);
                const toLevel = levels.find(l => l.id === path.to);
                if (!fromLevel || !toLevel) return null;
                
                let pathColor = "#fbbf24";
                let pathStroke = "4";
                let pathStyle = "5,5";
                
                // Customize path appearance based on terrain type
                switch (path.type) {
                  case "river":
                    pathColor = "#0891b2";
                    pathStroke = "6";
                    pathStyle = "10,5";
                    break;
                  case "mountain":
                    pathColor = "#8b5cf6";
                    pathStyle = "3,3";
                    break;
                  case "canyon":
                    pathColor = "#ea580c";
                    pathStyle = "8,4";
                    break;
                  case "final":
                    pathColor = "#fbbf24";
                    pathStroke = "6";
                    pathStyle = "15,5";
                    break;
                }
                
                return (
                  <Path
                    key={index}
                    d={`M ${fromLevel.x},${fromLevel.y + 25} Q ${(fromLevel.x + toLevel.x) / 2 + Math.sin(index) * 50},${(fromLevel.y + toLevel.y) / 2} ${toLevel.x},${toLevel.y - 25}`}
                    stroke={pathColor}
                    strokeWidth={pathStroke}
                    fill="none"
                    strokeDasharray={pathStyle}
                    opacity={toLevel.unlocked ? 0.8 : 0.3}
                  />
                );
              })}
              
              {/* Level markers */}
              {levels.map((level) => (
                <G key={level.id}>
                  {/* Level circle background */}
                  <Circle
                    cx={level.x}
                    cy={level.y}
                    r="25"
                    fill={level.completed ? "#10b981" : level.unlocked ? "#3b82f6" : "#6b7280"}
                    stroke={level.id === selectedLevel ? "#fbbf24" : "#1e293b"}
                    strokeWidth={level.id === selectedLevel ? "4" : "2"}
                    opacity={level.unlocked ? 1 : 0.5}
                  />
                  
                  {/* Level number */}
                  <SvgText
                    x={level.x}
                    y={level.y + 5}
                    fontSize="18"
                    fontWeight="bold"
                    fill="white"
                    textAnchor="middle"
                  >
                    {level.id}
                  </SvgText>
                  
                  {/* Completed checkmark */}
                  {level.completed && (
                    <Path
                      d={`M ${level.x - 10},${level.y} L ${level.x - 3},${level.y + 7} L ${level.x + 10},${level.y - 5}`}
                      stroke="white"
                      strokeWidth="3"
                      fill="none"
                    />
                  )}
                  
                  {/* Lock icon for locked levels */}
                  {!level.unlocked && (
                    <G>
                      <Circle
                        cx={level.x + 8}
                        cy={level.y - 8}
                        r="8"
                        fill="#dc2626"
                      />
                      <SvgText
                        x={level.x + 8}
                        y={level.y - 4}
                        fontSize="16"
                        fill="white"
                        textAnchor="middle"
                      >
                        🔒
                      </SvgText>
                    </G>
                  )}
                </G>
              ))}
              
  
            </Svg>
            
            {/* Touchable areas for levels */}
            {levels.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.levelTouchable,
                  {
                    left: level.x - 30,
                    top: level.y - 30,
                    opacity: level.unlocked ? 1 : 0.5
                  }
                ]}
                onPress={() => handleLevelPress(level.id)}
                disabled={!level.unlocked}
              />
            ))}
          </View>
        </ScrollView>

        {/* Level info panel */}
        {selectedLevel && (
          <XStack 
            position="absolute" 
            bottom={20} 
            left={20} 
            right={20}
            backgroundColor="rgba(30, 41, 59, 0.95)"
            borderRadius={12}
            padding="$4"
            alignItems="center"
            justifyContent="space-between"
            borderWidth={2}
            borderColor="#475569"
          >
            <YStack>
              <Text fontSize={18} fontWeight="bold" color="#f1f5f9">
                {levels.find(l => l.id === selectedLevel)?.name}
              </Text>
              <Text fontSize={14} color="#94a3b8" marginTop="$1">
                {levels.find(l => l.id === selectedLevel)?.theme && 
                  `${levels.find(l => l.id === selectedLevel)?.theme.charAt(0).toUpperCase() + levels.find(l => l.id === selectedLevel)?.theme.slice(1)} Zone`
                }
              </Text>
              <Text fontSize={14} color="#94a3b8" marginTop="$1">
                {levels.find(l => l.id === selectedLevel)?.completed ? "✅ Completed" : "🚀 Ready to start"}
              </Text>
            </YStack>
            <TouchableOpacity
              style={[
                styles.startButton,
                levels.find(l => l.id === selectedLevel)?.completed 
                  ? { backgroundColor: '#64748b' } 
                  : {}
              ]}
              onPress={() => {
                const level = levels.find(l => l.id === selectedLevel);
                if (level && level.unlocked && !level.completed) {
                  router.push(`/workout-detail?level=${selectedLevel}`);
                }
              }}
              disabled={!!levels.find(l => l.id === selectedLevel)?.completed}
            >
              <Text fontSize={16} fontWeight="bold" color="white">
                {levels.find(l => l.id === selectedLevel)?.completed ? "Completed" : "Start Training"}
              </Text>
            </TouchableOpacity>
          </XStack>
        )}
      </YStack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a202c',
  },
  headerGradient: {
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  worldContainer: {
    position: 'relative',
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
  },
  svgWorld: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  levelTouchable: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  startButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
});
