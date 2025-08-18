import { useEffect, useRef, useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";

export default function SessionControls({
  startSession,
  stopSession,
  isSessionActive,
}) {
  const [isActivating, setIsActivating] = useState(false);
  const animationRef = useRef();
  const [frameContent, setFrameContent] = useState('');
  
  // --- Cube parameters and constants ---
  const width = 40;
  const height = 20;
  const cubeWidth = 10;        // Half the cube edge length (scaled down from 20 in C code)
  const distanceFromCam = 50;  // Distance from viewer to cube (scaled down from 100)
  const K1 = 20;               // Screen scale factor (scaled down from 40)
  
  const incrementSpeed = 0.6;  // Surface sampling resolution (matches C code)

  async function handleCubeClick() {
    if (isActivating) return;

    if (isSessionActive) {
      stopSession();
    } else {
      setIsActivating(true);
      try {
        await startSession();
      } catch (error) {
        console.error("Failed to start session:", error);
      } finally {
        setIsActivating(false);
      }
    }
  }

  useEffect(() => {
    if (isSessionActive) {
      setIsActivating(false);
    }
  }, [isSessionActive]);

  // --- 3D rotation calculation functions ---
  const calculateX = (i, j, k, A, B, C) => {
    return (
      j * Math.sin(A) * Math.sin(B) * Math.cos(C) - k * Math.cos(A) * Math.sin(B) * Math.cos(C) + 
      j * Math.cos(A) * Math.sin(C) + k * Math.sin(A) * Math.sin(C) + i * Math.cos(B) * Math.cos(C)
    );
  };

  const calculateY = (i, j, k, A, B, C) => {
    return (
      j * Math.cos(A) * Math.cos(C) + k * Math.sin(A) * Math.cos(C) - 
      j * Math.sin(A) * Math.sin(B) * Math.sin(C) + k * Math.cos(A) * Math.sin(B) * Math.sin(C) - 
      i * Math.cos(B) * Math.sin(C)
    );
  };

  const calculateZ = (i, j, k, A, B, C) => {
    return (
      k * Math.cos(A) * Math.cos(B) - 
      j * Math.sin(A) * Math.cos(B) + i * Math.sin(B)
    );
  };

  const calculateForSurface = (cubeX, cubeY, cubeZ, ch, A, B, C, output, zbuffer, horizontalOffset = 0) => {
    const x = calculateX(cubeX, cubeY, cubeZ, A, B, C);
    const y = calculateY(cubeX, cubeY, cubeZ, A, B, C);
    const z = calculateZ(cubeX, cubeY, cubeZ, A, B, C) + distanceFromCam;

    const ooz = 1 / z;

    const xp = Math.floor(width / 2 + horizontalOffset + K1 * ooz * x * 2 - 5);
    const yp = Math.floor(height / 2 + K1 * ooz * y);

    if (xp >= 0 && xp < width && yp >= 0 && yp < height && ooz > zbuffer[yp][xp]) {
      zbuffer[yp][xp] = ooz;
      output[yp][xp] = ch;
    }
  };

  useEffect(() => {
    let A = 0;  // Rotation around x-axis
    let B = 0;  // Rotation around y-axis  
    let C = 0;  // Rotation around z-axis
    
    const renderFrame = () => {
      // --- Initialize framebuffer and z-buffer ---
      const output = new Array(height).fill(null).map(() => new Array(width).fill(' '));
      const zbuffer = new Array(height).fill(null).map(() => new Array(width).fill(0));
      
      // --- Generate cube surface points ---
      for (let cubeX = -cubeWidth; cubeX < cubeWidth; cubeX += incrementSpeed) {
        for (let cubeY = -cubeWidth; cubeY < cubeWidth; cubeY += incrementSpeed) {
          // --- Render each face of the cube with different characters ---
          calculateForSurface(cubeX, cubeY, -cubeWidth, '@', A, B, C, output, zbuffer, 0); // back face
          calculateForSurface(cubeWidth, cubeY, cubeX, '$', A, B, C, output, zbuffer, 0);   // right face
          calculateForSurface(-cubeWidth, cubeY, -cubeX, '~', A, B, C, output, zbuffer, 0); // left face
          calculateForSurface(-cubeX, cubeY, cubeWidth, '#', A, B, C, output, zbuffer, 0);  // front face
          calculateForSurface(cubeX, -cubeWidth, -cubeY, ';', A, B, C, output, zbuffer, 0); // bottom face
          calculateForSurface(cubeX, cubeWidth, cubeY, '+', A, B, C, output, zbuffer, 0);   // top face
        }
      }
      
      // --- Convert framebuffer to string ---
      const frame = output.map(row => row.join('')).join('\n');
      setFrameContent(frame);
      
      // --- Update rotation angles ---
      A += 0.02;
      B += 0.02;
      C += 0.005;
      
      animationRef.current = requestAnimationFrame(renderFrame);
    };
    
    renderFrame();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height, cubeWidth, distanceFromCam, K1, incrementSpeed]);
  // --- Determine cube color based on session state ---
  const getCubeColor = () => {
    if (isActivating) return '#666666';  // Medium gray when activating
    if (isSessionActive) return '#00ff00';  // Green when active
    return '#333333';  // Dark gray when inactive
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 16,
      }}
    >
      <TouchableOpacity
        onPress={handleCubeClick}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: 10,
        }}
        disabled={isActivating}
      >
        <Text
          style={{
            fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
            fontSize: 8,
            lineHeight: 9,
            color: getCubeColor(),
            textAlign: 'center',
          }}
        >
          {frameContent || new Array(height).fill(' '.repeat(width)).join('\n')}
        </Text>
        
        <Text
          style={{
            marginTop: 8,
            fontSize: 12,
            color: getCubeColor(),
            textAlign: 'center',
          }}
        >
          {isActivating ? 'starting...' : isSessionActive ? 'tap to disconnect' : 'tap to connect'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
