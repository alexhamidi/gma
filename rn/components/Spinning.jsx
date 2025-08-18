import React, { useEffect, useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';

const SpinningTorus = ({ width = 40, height = 20 }) => {
  const animationRef = useRef();
  const [frameContent, setFrameContent] = useState('');
  
  // --- Torus parameters and constants ---
  const R1 = 1;           // Minor radius (tube radius)
  const R2 = 2;           // Major radius (distance from center to tube center)
  const K2 = 5;           // Distance from viewer to torus
  const K1 = width * K2 * 3 / (8 * (R1 + R2));  // Screen scale factor
  
  const theta_spacing = 0.07;  // Angular resolution for cross-section
  const phi_spacing = 0.02;    // Angular resolution for revolution
  
  const luminance_chars = ".,-~:;=!*#$@";
  
  useEffect(() => {
    let A = 0;  // Rotation around x-axis
    let B = 0;  // Rotation around z-axis
    
    const renderFrame = () => {
      // --- Precompute rotation matrix values ---
      const cosA = Math.cos(A);
      const sinA = Math.sin(A);
      const cosB = Math.cos(B);
      const sinB = Math.sin(B);
      
      // --- Initialize framebuffer and z-buffer ---
      const output = new Array(height).fill(null).map(() => new Array(width).fill(' '));
      const zbuffer = new Array(height).fill(null).map(() => new Array(width).fill(0));
      
      // --- Generate torus surface points ---
      for (let theta = 0; theta < 6.28; theta += theta_spacing) {
        const costheta = Math.cos(theta);
        const sintheta = Math.sin(theta);
        
        for (let phi = 0; phi < 6.28; phi += phi_spacing) {
          const cosphi = Math.cos(phi);
          const sinphi = Math.sin(phi);
          
          // --- Circle coordinates before revolution ---
          const circlex = R2 + R1 * costheta;
          const circley = R1 * sintheta;
          
          // --- Apply 3D rotations using matrix multiplication ---
          // Final 3D coordinates after all rotations
          const x = circlex * (cosB * cosphi + sinA * sinB * sinphi) - circley * cosA * sinB;
          const y = circlex * (sinB * cosphi - sinA * cosB * sinphi) + circley * cosA * cosB;
          const z = K2 + cosA * circlex * sinphi + circley * sinA;
          
          const ooz = 1 / z;  // One over z for projection
          
          // --- 3D to 2D projection ---
          const xp = Math.floor(width / 2 + K1 * ooz * x);
          const yp = Math.floor(height / 2 - K1 * ooz * y);
          
          // --- Surface normal and lighting calculation ---
          // Surface normal after same rotations as applied to point
          const L = cosphi * costheta * sinB - cosA * costheta * sinphi - 
                   sinA * sintheta + cosB * (cosA * sintheta - costheta * sinA * sinphi);
          
          // --- Render pixel if visible and closer than existing ---
          if (L > 0 && xp >= 0 && xp < width && yp >= 0 && yp < height && ooz > zbuffer[yp][xp]) {
            zbuffer[yp][xp] = ooz;
            const luminance_index = Math.floor(L * 8);
            const char_index = Math.max(0, Math.min(luminance_chars.length - 1, luminance_index));
            output[yp][xp] = luminance_chars[char_index];
          }
        }
      }
      
      // --- Convert framebuffer to string ---
      const frame = output.map(row => row.join('')).join('\n');
      setFrameContent(frame);
      
      // --- Update rotation angles ---
      A += 0.04;
      B += 0.02;
      
      animationRef.current = requestAnimationFrame(renderFrame);
    };
    
    renderFrame();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height, K1]);
  
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text
        style={{
          fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
          fontSize: 8,
          lineHeight: 9,
          color: '#333333',
          padding: 5,
          textAlign: 'center',
        }}
      >
        {frameContent || new Array(height).fill(' '.repeat(width)).join('\n')}
      </Text>
    </View>
  );
};

export default SpinningTorus;
