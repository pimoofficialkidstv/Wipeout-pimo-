import React, { useEffect, useRef } from "react";
import { Character, MarketplaceItem, MarketplaceItemType } from "../types";

interface Moro3DProps {
  character: Character;
  width?: number;
  height?: number;
  isJumping?: boolean;
  jumpProgress?: number; // 0 to 1
  isBlinking?: boolean;
  isKicked?: boolean;
  isTalking?: boolean;
  isAngry?: boolean;
  isUpset?: boolean;
  rotation?: number;
  showBye?: boolean;
  idleAnimScale?: number;
  previewShirt?: MarketplaceItem;
  previewFace?: MarketplaceItem;
  previewBackpack?: MarketplaceItem;
  previewHair?: MarketplaceItem;
  previewBody?: MarketplaceItem;
  playerName?: string;
}

const Moro3D: React.FC<Moro3DProps> = ({
  character,
  width = 200,
  height = 200,
  isJumping = false,
  jumpProgress = 0,
  isBlinking = false,
  isKicked = false,
  isTalking = false,
  isAngry = false,
  isUpset = false,
  rotation = 0,
  showBye = false,
  idleAnimScale = 1,
  previewShirt,
  previewFace,
  previewBackpack,
  previewHair,
  previewBody,
  playerName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      frameRef.current++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2 + 20;

      ctx.save();
      ctx.translate(centerX, centerY);

      // Calcul des animations
      const breathe = Math.sin(frameRef.current * 0.08) * 2 * idleAnimScale;
      let squashX = 1;
      let squashY = 1;
      let offsetY = breathe;

      // Special Squeak Bounciness
      const isSqueak = character.id === "moro-squeak";
      const bounceIntensity = isSqueak ? 1.5 : 1;

      if (isJumping) {
        // jumpProgress 0 -> 1
        // Initial jump (0 -> 0.2)
        // Fly up (0.2 -> 1)
        const jumpY =
          showBye && jumpProgress >= 0.2
            ? -(jumpProgress - 0.2) * 1000
            : Math.sin(jumpProgress * (showBye ? 5 : 1) * Math.PI) * -80;
        offsetY = jumpY;
        // Squash (0 -> 0.2)
        if (jumpProgress < 0.2 || !showBye) {
          squashY =
            1 +
            Math.abs(Math.sin(jumpProgress * (showBye ? 5 : 1) * Math.PI)) *
              0.3 *
              bounceIntensity;
          squashX =
            1 -
            Math.abs(Math.sin(jumpProgress * (showBye ? 5 : 1) * Math.PI)) *
              0.15 *
              bounceIntensity;
        }
      } else if (isSqueak) {
        // Extra Idle Bounciness for Squeak
        squashY = 1 + Math.sin(frameRef.current * 0.1) * 0.05;
        squashX = 1 - Math.sin(frameRef.current * 0.1) * 0.05;
      }

      ctx.translate(0, offsetY);
      ctx.rotate(rotation);
      ctx.scale(squashX, squashY);

      if (character.id === "pbj-banana") {
        // --- DANCING BANANA (Peanut Butter Jelly Time) ---
        const danceAngle = Math.sin(frameRef.current * 0.15) * 0.2;
        ctx.rotate(danceAngle);

        // Banana Body (Curved)
        ctx.save();
        ctx.fillStyle = "#fde047"; // Yellow
        ctx.strokeStyle = "#854d0e"; // Brownish outline
        ctx.lineWidth = 2;

        ctx.beginPath();
        // Draw a curved banana shape
        ctx.moveTo(-15, -45);
        ctx.quadraticCurveTo(25, -30, 15, 45); // Outer curve
        ctx.quadraticCurveTo(5, 50, -5, 45); // Bottom
        ctx.quadraticCurveTo(0, -20, -20, -40); // Inner curve
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Banana Tip (Top)
        ctx.fillStyle = "#422006";
        ctx.beginPath();
        ctx.moveTo(-15, -45);
        ctx.lineTo(-10, -52);
        ctx.lineTo(-5, -46);
        ctx.closePath();
        ctx.fill();

        // Banana Tip (Bottom)
        ctx.beginPath();
        ctx.arc(10, 46, 4, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(-2, -15, 3, 0, Math.PI * 2);
        ctx.arc(8, -12, 3, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.beginPath();
        ctx.arc(3, -5, 5, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Arms (Peanut Butter Jelly Time style - thin lines)
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        const armWave = Math.sin(frameRef.current * 0.2) * 10;

        // Left Arm
        ctx.beginPath();
        ctx.moveTo(-10, -10);
        ctx.lineTo(-30, -20 + armWave);
        ctx.stroke();

        // Right Arm
        ctx.beginPath();
        ctx.moveTo(15, -5);
        ctx.lineTo(35, -15 - armWave);
        ctx.stroke();

        // Legs
        const legWave = Math.cos(frameRef.current * 0.2) * 5;
        ctx.beginPath();
        ctx.moveTo(-5, 35);
        ctx.lineTo(-15, 55 + legWave);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(10, 38);
        ctx.lineTo(20, 55 - legWave);
        ctx.stroke();

        ctx.restore();

        // Skip the rest of the standard Moro rendering
        ctx.restore();
        animId = requestAnimationFrame(render);
        return;
      }

      if (character.id === "moro-ball") {
        // --- BALL MORO ---
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;

        // Ball Base
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Soccer Ball Pattern (Pentagons)
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const px = Math.cos(angle) * 15;
          const py = Math.sin(angle) * 15;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Lines connecting to edges
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const px1 = Math.cos(angle) * 15;
          const py1 = Math.sin(angle) * 15;
          const px2 = Math.cos(angle) * 40;
          const py2 = Math.sin(angle) * 40;
          ctx.beginPath();
          ctx.moveTo(px1, py1);
          ctx.lineTo(px2, py2);
          ctx.stroke();
        }

        // Face over the ball
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(-10, -5, 4, 0, Math.PI * 2);
        ctx.fill(); // Left eye
        ctx.beginPath();
        ctx.arc(10, -5, 4, 0, Math.PI * 2);
        ctx.fill(); // Right eye

        // Smile
        ctx.beginPath();
        ctx.arc(0, 5, 8, 0, Math.PI);
        ctx.stroke();

        ctx.restore();

        // Skip the rest of the standard Moro rendering
        ctx.restore();
        animId = requestAnimationFrame(render);
        return;
      }

      if (character.id === "moro-squeak") {
        // --- MORO SQUEAK (Old Style) ---
        ctx.save();

        // Squeak Body (Blue)
        const squeakGrad = ctx.createRadialGradient(-10, -10, 5, 0, 0, 40);
        squeakGrad.addColorStop(0, "#60a5fa");
        squeakGrad.addColorStop(0.6, "#3b82f6");
        squeakGrad.addColorStop(1, "#2563eb");
        ctx.fillStyle = squeakGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 38, 0, Math.PI * 2);
        ctx.fill();

        // White Muzzle (Old Style)
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(-28, 12);
        ctx.quadraticCurveTo(-15, -5, 0, -8); // Left to peak
        ctx.quadraticCurveTo(15, -5, 28, 12); // Peak to right
        ctx.quadraticCurveTo(0, 38, -28, 12); // Bottom curve
        ctx.fill();

        // Face Dots (Eyes)
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(-10, -14, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(10, -14, 4, 0, Math.PI * 2);
        ctx.fill();

        // Small Blue Smile
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, 10, 8, 0.4, Math.PI - 0.4);
        ctx.stroke();

        // Glue Particles if Kicking
        if (isKicked) {
          ctx.fillStyle = "#bfdbfe";
          ctx.globalAlpha = 0.8;
          for (let i = 0; i < 8; i++) {
            const angle = frameRef.current * 0.1 + (i * Math.PI * 2) / 8;
            const dist = 30 + Math.sin(frameRef.current * 0.2) * 10;
            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle) * dist;
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();

        // Skip the rest of the standard Moro rendering
        ctx.restore();
        animId = requestAnimationFrame(render);
        return;
      }

      // 1. Sac à dos (Rendu 3D par couches) - Seulement si équipé
      const hasBackpack = !!(previewBackpack || character.backpackId);
      if (hasBackpack) {
        const bY = Math.sin(frameRef.current * 0.3) * 1.5;
        ctx.save();
        ctx.fillStyle = "#1e1b4b";
        ctx.beginPath();
        ctx.roundRect(-45, -18 + bY, 35, 52, 14);
        ctx.fill();

        const backpackColor =
          previewBackpack?.backpackColor ||
          character.backpackColor ||
          character.accessoryColor;
        const backpackGrad = ctx.createLinearGradient(-40, -14, -10, 30);
        backpackGrad.addColorStop(0, backpackColor);
        backpackGrad.addColorStop(1, "#2d1b4d");
        ctx.fillStyle = backpackGrad;
        ctx.beginPath();
        ctx.roundRect(-40, -14 + bY, 28, 44, 12);
        ctx.fill();

        // Backpack Pattern
        const getBackpackPattern = (id: string) => {
          const p = id.replace("backpack-", "");
          if (p === "mecha") return "mecha_wings";
          if (p === "katana") return "katanas";
          if (p === "secret") return "void";
          return p;
        };
        const backpackPattern = previewBackpack
          ? getBackpackPattern(previewBackpack.id)
          : character.backpackId
            ? getBackpackPattern(character.backpackId)
            : null;
        if (backpackPattern) {
          ctx.save();
          ctx.clip(); // Clip to backpack shape
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = "#fff";
          ctx.strokeStyle = "#fff";

          if (backpackPattern === "sport") {
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-35, -10 + bY);
            ctx.lineTo(-15, 20 + bY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-15, -10 + bY);
            ctx.lineTo(-35, 20 + bY);
            ctx.stroke();
          } else if (backpackPattern === "tactical") {
            ctx.lineWidth = 1;
            for (let i = -10; i < 30; i += 8) {
              ctx.beginPath();
              ctx.moveTo(-40, i + bY);
              ctx.lineTo(-10, i + bY);
              ctx.stroke();
            }
          } else if (backpackPattern === "wings") {
            ctx.fillStyle = "#f8fafc";
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.moveTo(-35, 0 + bY);
            ctx.quadraticCurveTo(-50, -20 + bY, -60, -10 + bY);
            ctx.quadraticCurveTo(-45, 10 + bY, -35, 15 + bY);
            ctx.fill();
          } else if (backpackPattern === "jetpack") {
            ctx.fillStyle = "#94a3b8";
            ctx.globalAlpha = 1;
            ctx.fillRect(-35, -5 + bY, 8, 30);
            ctx.fillRect(-23, -5 + bY, 8, 30);
            // flames
            ctx.fillStyle = "#ef4444";
            ctx.beginPath();
            ctx.moveTo(-31, 25 + bY);
            ctx.lineTo(-35, 35 + bY + Math.random() * 5);
            ctx.lineTo(-27, 35 + bY + Math.random() * 5);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-19, 25 + bY);
            ctx.lineTo(-23, 35 + bY + Math.random() * 5);
            ctx.lineTo(-15, 35 + bY + Math.random() * 5);
            ctx.fill();
          } else if (backpackPattern === "void") {
            ctx.fillStyle = "#000";
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.arc(-26, 8 + bY, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#a855f7";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(
              -26,
              8 + bY,
              12 + Math.sin(frameRef.current * 0.1) * 2,
              0,
              Math.PI * 2,
            );
            ctx.stroke();
          } else if (backpackPattern === "mecha_wings") {
            ctx.fillStyle = "#38bdf8";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#38bdf8";
            ctx.beginPath();
            ctx.moveTo(-30, -5 + bY);
            ctx.lineTo(-65, -30 + bY);
            ctx.lineTo(-50, 5 + bY);
            ctx.lineTo(-60, 25 + bY);
            ctx.lineTo(-30, 15 + bY);
            ctx.fill();
            ctx.shadowBlur = 0;
          } else if (backpackPattern === "katanas") {
            ctx.strokeStyle = "#e2e8f0";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-50, -35 + bY);
            ctx.lineTo(-10, 35 + bY);
            ctx.moveTo(-10, -35 + bY);
            ctx.lineTo(-50, 35 + bY);
            ctx.stroke();
            ctx.fillStyle = "#dc2626";
            ctx.fillRect(-54, -40 + bY, 8, 8);
            ctx.fillRect(-14, -40 + bY, 8, 8);
          } else if (backpackPattern === "pizza") {
            ctx.fillStyle = "#facc15";
            ctx.beginPath();
            ctx.moveTo(-26, -15 + bY);
            ctx.lineTo(-45, 30 + bY);
            ctx.lineTo(-10, 30 + bY);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#ef4444";
            ctx.beginPath();
            ctx.arc(-28, 5 + bY, 4, 0, Math.PI * 2);
            ctx.arc(-20, 20 + bY, 3, 0, Math.PI * 2);
            ctx.fill();
          } else if (backpackPattern === "guitar") {
            ctx.fillStyle = "#dc2626";
            ctx.beginPath();
            ctx.ellipse(-26, 15 + bY, 12, 18, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#1e293b";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-26, 15 + bY);
            ctx.lineTo(-45, -30 + bY);
            ctx.stroke();
          }
          ctx.restore();
        } else {
          // Default Texture de tissu
          ctx.globalAlpha = 0.1;
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 1;
          for (let i = -35; i < -15; i += 4) {
            ctx.beginPath();
            ctx.moveTo(i, -10 + bY);
            ctx.lineTo(i, 20 + bY);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // --- HAIR BACK ---
      const hair =
        previewHair || (character.hairId ? { id: character.hairId } : null);
      const hairMode = hair?.id ? hair.id.replace("hair-", "") : "none";
      const hColor = character.hairColor || "#1e293b";

      if (
        hairMode === "long" ||
        hairMode === "braids" ||
        hairMode === "ponytail"
      ) {
        ctx.save();
        ctx.fillStyle = hColor;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        if (hairMode === "long") {
          ctx.beginPath();
          ctx.moveTo(-38, 0);
          ctx.quadraticCurveTo(-50, 45, -20, 45);
          ctx.lineTo(-20, -10);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(38, 0);
          ctx.quadraticCurveTo(50, 45, 20, 45);
          ctx.lineTo(20, -10);
          ctx.fill();
          ctx.stroke();
        } else if (hairMode === "braids") {
          for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < 3; i++) {
              ctx.beginPath();
              ctx.arc(side * 30, 5 + i * 15, 10, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
          }
        } else if (hairMode === "ponytail") {
          ctx.beginPath();
          ctx.arc(38, 0, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. Corps (Sphère PBR stylisée ou Pomme Rouge Pimo)
      ctx.save();
      const activeBodyId = previewBody?.id || character.bodyId || "body-circle";
      const isHuman = activeBodyId === "body-human";
      const isRoblox = activeBodyId === "body-roblox";
      const isPimo =
        character.id === "moro-classic" ||
        character.id === "pimo-classic" ||
        character.name.toLowerCase().includes("pimo") ||
        character.emoji === "🍎" ||
        character.bodyColor === "#ef4444" ||
        character.bodyColor === "#dc2626";

      const bodyGrad = ctx.createRadialGradient(-12, -14, 4, 0, 0, 42);
      if (isPimo) {
        bodyGrad.addColorStop(0, "#ff7575");
        bodyGrad.addColorStop(0.25, "#ef4444");
        bodyGrad.addColorStop(0.7, "#dc2626");
        bodyGrad.addColorStop(1, "#991b1b");
      } else {
        bodyGrad.addColorStop(0, "#ffffff");
        bodyGrad.addColorStop(0.25, character.bodyColor);
        bodyGrad.addColorStop(0.8, character.bodyColor);
        bodyGrad.addColorStop(1, "#0f172a");
      }
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();

      if (isRoblox) {
        // Arms
        ctx.roundRect(-42, -20, 14, 45, 2);
        ctx.roundRect(28, -20, 14, 45, 2);
        // Legs
        ctx.roundRect(-22, 37, 20, 25, 2);
        ctx.roundRect(2, 37, 20, 25, 2);
        // Torso
        ctx.roundRect(-26, -35, 52, 70, 3);
      } else if (isHuman) {
        // Legs
        ctx.roundRect(-15, 42, 10, 30, 5);
        ctx.roundRect(5, 42, 10, 30, 5);
        // Arms
        ctx.roundRect(-34, -5, 10, 40, 5);
        ctx.roundRect(24, -5, 10, 40, 5);
        // Torso
        ctx.arc(0, -2, 20, 0, Math.PI * 2);
        ctx.moveTo(-10, 14);
        ctx.lineTo(10, 14);
        ctx.quadraticCurveTo(24, 14, 24, 24);
        ctx.lineTo(18, 40);
        ctx.lineTo(-18, 40);
        ctx.lineTo(-24, 24);
        ctx.quadraticCurveTo(-24, 14, -10, 14);
      } else if (isPimo) {
        // Lovely chubby Red Apple body silhouette with top and bottom natural apple clefts
        ctx.beginPath();
        ctx.moveTo(0, -31);
        ctx.bezierCurveTo(18, -42, 43, -22, 41, 6);
        ctx.bezierCurveTo(40, 28, 24, 41, 8, 40);
        ctx.bezierCurveTo(0, 38, 0, 38, -8, 40);
        ctx.bezierCurveTo(-24, 41, -40, 28, -41, 6);
        ctx.bezierCurveTo(-43, -22, -18, -42, 0, -31);
        ctx.closePath();
      } else {
        ctx.arc(0, 0, 38, 0, Math.PI * 2);
      }
      ctx.fill();

      // Apple Cheeks & Features for Pimo
      if (isPimo && !isRoblox && !isHuman) {
        ctx.save();
        // Cute Rosy Blush Cheeks
        ctx.fillStyle = "rgba(254, 205, 211, 0.75)";
        ctx.beginPath();
        ctx.ellipse(-20, 6, 7.5, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(20, 6, 7.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cute cartoon shoes / feet bouncing
        const footBounce = isJumping ? Math.sin(jumpProgress * Math.PI) * 6 : Math.sin(frameRef.current * 0.15) * 2;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2.5;

        // Left shoe
        ctx.beginPath();
        ctx.roundRect(-22, 36 + footBounce, 16, 12, 6);
        ctx.fill();
        ctx.stroke();

        // Right shoe
        ctx.beginPath();
        ctx.roundRect(6, 36 - footBounce, 16, 12, 6);
        ctx.fill();
        ctx.stroke();

        // Cute cartoon hands at the sides
        const handWave = isTalking || isJumping ? Math.sin(frameRef.current * 0.3) * 6 : Math.sin(frameRef.current * 0.1) * 2;
        // Left hand
        ctx.beginPath();
        ctx.arc(-39, 10 + handWave, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Right hand
        ctx.beginPath();
        ctx.arc(39, 10 - handWave, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Cute Apple Stem & Green Leaf on Top of Pimo
        if (!hairMode || hairMode === "none") {
          const leafSway = Math.sin(frameRef.current * 0.1) * 0.12;

          // Cute brown curved stem
          ctx.strokeStyle = "#78350f";
          ctx.lineWidth = 5;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(0, -31);
          ctx.quadraticCurveTo(3, -45, 6, -55);
          ctx.stroke();

          // Stem woody highlight
          ctx.strokeStyle = "#92400e";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-1, -32);
          ctx.quadraticCurveTo(2, -45, 5, -54);
          ctx.stroke();

          // Green Apple Leaf growing out of stem
          ctx.save();
          ctx.translate(4, -45);
          ctx.rotate(leafSway);
          ctx.fillStyle = "#22c55e";
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(18, -14, 26, -5);
          ctx.quadraticCurveTo(16, 10, 0, 0);
          ctx.fill();

          // Leaf outline & vein
          ctx.strokeStyle = "#15803d";
          ctx.lineWidth = 1.8;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(12, -4, 20, -5);
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }

      // --- SHIRT PATTERN ---
      const shirt =
        previewShirt ||
        (character.shirtId
          ? { pattern: character.shirtId.replace("shirt-", ""), shirtColor: character.shirtColor }
          : null);
      if (shirt && shirt.pattern) {
        ctx.save();
        ctx.clip(); // Clip to body
        const sColor = character.shirtColor || (shirt as any).shirtColor || "#ffffff";
        ctx.globalAlpha = sColor === "#ffffff" ? 0.35 : 0.75;
        ctx.strokeStyle = sColor;
        ctx.fillStyle = sColor;

        if (shirt.pattern === "stripes") {
          ctx.lineWidth = 4;
          for (let i = -45; i < 45; i += 10) {
            ctx.beginPath();
            ctx.moveTo(-45, i);
            ctx.lineTo(45, i);
            ctx.stroke();
          }
        } else if (shirt.pattern === "dots") {
          for (let x = -45; x < 45; x += 12) {
            for (let y = -45; y < 45; y += 12) {
              ctx.beginPath();
              ctx.arc(x + (y % 24 === 0 ? 6 : 0), y, 3, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } else if (shirt.pattern === "check") {
          for (let x = -45; x < 45; x += 10) {
            for (let y = -45; y < 45; y += 10) {
              if (((x + y) / 10) % 2 === 0) ctx.fillRect(x, y, 10, 10);
            }
          }
        } else if (shirt.pattern === "flame") {
          ctx.strokeStyle = "#ff4400";
          ctx.lineWidth = 3;
          for (let i = -45; i < 45; i += 15) {
            ctx.beginPath();
            ctx.moveTo(i, 45);
            ctx.bezierCurveTo(i - 10, 20, i + 10, 10, i, -15);
            ctx.stroke();
          }
        } else if (shirt.pattern === "star") {
          ctx.fillStyle = "#fde047";
          for (let i = 0; i < 10; i++) {
            const sx = Math.sin(i * 2.5) * 35;
            const sy = Math.cos(i * 2.5) * 35;
            ctx.beginPath();
            ctx.arc(sx, sy, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (shirt.pattern === "money") {
          ctx.fillStyle = "#15803d"; // Darker green
          ctx.globalAlpha = 0.6;
          // Draw some money bills / dollar signs
          ctx.font = "bold 12px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          for (let i = 0; i < 8; i++) {
            const sx = Math.sin(i * 3.1) * 30;
            const sy = Math.cos(i * 2.7) * 30;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(i * 0.5);
            ctx.fillText("$", 0, 0);
            ctx.restore();
          }
        } else if (shirt.pattern === "cyber") {
          ctx.strokeStyle = "#06b6d4";
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.8;
          for (let x = -30; x <= 30; x += 12) {
            ctx.beginPath(); ctx.moveTo(x, -35); ctx.lineTo(x, 35); ctx.stroke();
          }
          for (let y = -30; y <= 30; y += 12) {
            ctx.beginPath(); ctx.moveTo(-35, y); ctx.lineTo(35, y); ctx.stroke();
          }
        } else if (shirt.pattern === "galaxy") {
          ctx.fillStyle = "#e0e7ff";
          for (let i = 0; i < 15; i++) {
            const gx = Math.sin(i * 4.2) * 30;
            const gy = Math.cos(i * 3.1) * 30;
            ctx.beginPath(); ctx.arc(gx, gy, (i % 3) + 1, 0, Math.PI * 2); ctx.fill();
          }
        } else if (shirt.pattern === "gold") {
          ctx.fillStyle = "#eab308";
          ctx.fillRect(-15, -20, 30, 40);
          ctx.fillStyle = "#000000";
          ctx.beginPath();
          ctx.moveTo(-10, -20); ctx.lineTo(0, -5); ctx.lineTo(10, -20);
          ctx.fill();
        } else if (shirt.pattern === "camo") {
          ctx.fillStyle = "#15803d";
          for (let i = 0; i < 6; i++) {
            const cx = Math.sin(i * 2.1) * 25;
            const cy = Math.cos(i * 1.8) * 25;
            ctx.beginPath(); ctx.ellipse(cx, cy, 10, 6, i, 0, Math.PI * 2); ctx.fill();
          }
        } else if (shirt.pattern === "heart") {
          ctx.fillStyle = "#f43f5e";
          ctx.font = "14px Arial";
          for (let i = 0; i < 6; i++) {
            const hx = Math.sin(i * 2.8) * 25;
            const hy = Math.cos(i * 2.2) * 25;
            ctx.fillText("❤️", hx, hy);
          }
        }
        ctx.restore();
      }

      // Lumière de contour (Rim Light)
      const fresnel = ctx.createRadialGradient(0, 0, 32, 0, 0, 38);
      fresnel.addColorStop(0, "rgba(255,255,255,0)");
      fresnel.addColorStop(1, "rgba(255,255,255,0.4)");
      ctx.fillStyle = fresnel;
      ctx.globalCompositeOperation = "lighter";
      ctx.beginPath();
      if (isRoblox) {
        // Arms
        ctx.roundRect(-42, -20, 14, 45, 2);
        ctx.roundRect(28, -20, 14, 45, 2);
        // Legs
        ctx.roundRect(-22, 37, 20, 25, 2);
        ctx.roundRect(2, 37, 20, 25, 2);
        // Torso
        ctx.roundRect(-26, -35, 52, 70, 3);
      } else if (isHuman) {
        // Legs
        ctx.roundRect(-15, 42, 10, 30, 5);
        ctx.roundRect(5, 42, 10, 30, 5);
        // Arms
        ctx.roundRect(-34, -5, 10, 40, 5);
        ctx.roundRect(24, -5, 10, 40, 5);
        // Torso
        ctx.arc(0, -2, 20, 0, Math.PI * 2);
        ctx.moveTo(-10, 14);
        ctx.lineTo(10, 14);
        ctx.quadraticCurveTo(24, 14, 24, 24);
        ctx.lineTo(18, 40);
        ctx.lineTo(-18, 40);
        ctx.lineTo(-24, 24);
        ctx.quadraticCurveTo(-24, 14, -10, 14);
      } else {
        ctx.arc(0, 0, 38, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();

      // 3. Visage
      ctx.save();
      ctx.fillStyle = "#0f172a";
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";

      const getEyesType = (id) => {
        if (!id) return "default";
        const p = id.replace("face-", "");
        if (p === "cyber") return "visor";
        return p;
      };
      const face = previewFace || (character.faceId ? { eyes: getEyesType(character.faceId), mouth: "smile" } : null);
      let eyesType = face?.eyes || ((face as any)?.id ? getEyesType((face as any).id) : null) || "default";
      let mouthType = face?.mouth || "smile";

      if (isAngry) {
        eyesType = "angry";
      } else if (isUpset) {
        eyesType = "derp";
      }

      if (isKicked) {
        ctx.font = "bold 32px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("×", -14, -6);
        ctx.fillText("×", 14, -6);
        ctx.beginPath();
        ctx.arc(0, 18, 10, Math.PI, 0);
        ctx.stroke();
      } else if (isBlinking && !isAngry) {
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(-22, -6);
        ctx.lineTo(-10, -6);
        ctx.moveTo(10, -6);
        ctx.lineTo(22, -6);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 10, 12, 0.4, Math.PI - 0.4);
        ctx.stroke();
      } else {
        // EYES
        if (eyesType === "shades" || eyesType === "cool") {
          ctx.fillStyle = "#1e293b";
          ctx.beginPath();
          ctx.roundRect(-28, -12, 22, 14, 4);
          ctx.roundRect(6, -12, 22, 14, 4);
          ctx.fill();
          ctx.strokeStyle = "#475569";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-6, -5);
          ctx.lineTo(6, -5);
          ctx.stroke();
        } else if (eyesType === "uwu") {
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(-24, -10);
          ctx.lineTo(-16, -2);
          ctx.lineTo(-8, -10);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(8, -10);
          ctx.lineTo(16, -2);
          ctx.lineTo(24, -10);
          ctx.stroke();
        } else if (eyesType === "angry") {
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(-24, -12);
          ctx.lineTo(-8, -4);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(24, -12);
          ctx.lineTo(8, -4);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(-16, -2, 4, 0, Math.PI * 2);
          ctx.arc(16, -2, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (eyesType === "derp") {
          ctx.beginPath();
          ctx.arc(-16, -6, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(16, -6, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (eyesType === "heart") {
          ctx.fillStyle = "#f43f5e";
          ctx.font = "24px Arial";
          ctx.textAlign = "center";
          ctx.fillText("❤️", -16, -2);
          ctx.fillText("❤️", 16, -2);
        } else if (eyesType === "miket") {
          // Left eye (ticket)
          ctx.fillStyle = "#facc15"; // yellow-400
          ctx.beginPath();
          ctx.roundRect(-24, -10, 16, 8, 2);
          ctx.fill();
          ctx.fillStyle = "#0f172a"; // black hole
          ctx.beginPath();
          ctx.arc(-22, -6, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(-10, -6, 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Right eye (ticket)
          ctx.fillStyle = "#facc15";
          ctx.beginPath();
          ctx.roundRect(8, -10, 16, 8, 2);
          ctx.fill();
          ctx.fillStyle = "#0f172a";
          ctx.beginPath();
          ctx.arc(10, -6, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(22, -6, 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (eyesType === "visor") {
          ctx.fillStyle = "#06b6d4";
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#06b6d4";
          ctx.beginPath();
          ctx.roundRect(-28, -10, 56, 10, 4);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (eyesType === "anime") {
          ctx.fillStyle = "#000";
          ctx.beginPath(); ctx.ellipse(-16, -6, 8, 12, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(16, -6, 8, 12, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.beginPath(); ctx.arc(-18, -10, 3, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(14, -10, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "rgba(244, 63, 94, 0.4)";
          ctx.beginPath(); ctx.ellipse(-20, 4, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(20, 4, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
        } else if (eyesType === "pixel") {
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(-28, -10, 24, 8);
          ctx.fillRect(4, -10, 24, 8);
          ctx.fillRect(-6, -6, 12, 2);
        } else if (eyesType === "star") {
          ctx.fillStyle = "#facc15";
          ctx.font = "20px Arial";
          ctx.textAlign = "center";
          ctx.fillText("⭐", -16, 2);
          ctx.fillText("⭐", 16, 2);
        } else if (eyesType === "fire") {
          ctx.fillStyle = "#ef4444";
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#f59e0b";
          ctx.beginPath(); ctx.arc(-16, -6, 8, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(16, -6, 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#fde047";
          ctx.beginPath(); ctx.arc(-16, -6, 4, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(16, -6, 4, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.beginPath();
          ctx.arc(-16, -6, 7, 0, Math.PI * 2);
          ctx.arc(16, -6, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(-18, -8, 2.5, 0, Math.PI * 2);
          ctx.arc(14, -8, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // MOUTH
        ctx.fillStyle = "#0f172a";
        ctx.strokeStyle = "#0f172a";

        if (isTalking) {
          const mouthOpen = Math.abs(Math.sin(frameRef.current * 0.5)) * 10;
          ctx.beginPath();
          ctx.ellipse(
            0,
            12 + mouthOpen / 2,
            8,
            2 + mouthOpen,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        } else if (eyesType === "uwu") {
          ctx.beginPath();
          ctx.arc(-4, 10, 4, 0, Math.PI);
          ctx.arc(4, 10, 4, 0, Math.PI);
          ctx.stroke();
        } else if (eyesType === "angry" || isAngry) {
          ctx.beginPath();
          ctx.arc(0, 20, 10, Math.PI + 0.5, -0.5);
          ctx.stroke();
        } else if (eyesType === "derp") {
          ctx.beginPath();
          ctx.arc(0, 10, 8, 0, Math.PI);
          ctx.stroke();
          ctx.fillStyle = "#fb7185";
          ctx.beginPath();
          ctx.roundRect(2, 12, 8, 12, 4);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 10, 12, 0.4, Math.PI - 0.4);
          ctx.stroke();
        }
      }
      ctx.restore();

      // 4. Reflet brillant (Gloss)
      ctx.save();
      const glass = ctx.createLinearGradient(-35, -35, 35, 35);
      glass.addColorStop(0, "rgba(255,255,255,0.4)");
      glass.addColorStop(0.5, "rgba(255,255,255,0)");
      glass.addColorStop(1, "rgba(255,255,255,0.1)");
      ctx.fillStyle = glass;
      ctx.beginPath();
      if (isPimo) {
        ctx.ellipse(-14, -16, 12, 6, -0.6, 0, Math.PI * 2);
      } else {
        ctx.arc(0, 0, 38, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();

      // --- HAIR FRONT ---
      if (hairMode && hairMode !== "none") {
        ctx.save();
        ctx.fillStyle = hColor;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;

        if (hairMode === "spiky") {
          ctx.beginPath();
          ctx.moveTo(-35, -15);
          for (let i = -30; i <= 30; i += 12) {
            const h = 5 + Math.abs(Math.sin(frameRef.current * 0.1 + i)) * 12;
            ctx.lineTo(i, -32 - h);
            ctx.lineTo(i + 6, -32);
          }
          ctx.lineTo(35, -15);
          ctx.fill();
          ctx.stroke();
        } else if (hairMode === "long") {
          // Bangs
          ctx.beginPath();
          ctx.moveTo(-32, -20);
          ctx.quadraticCurveTo(0, -48, 32, -20);
          ctx.quadraticCurveTo(15, -15, 0, -28);
          ctx.quadraticCurveTo(-15, -15, -32, -20);
          ctx.fill();
          ctx.stroke();
        } else if (hairMode === "afro") {
          ctx.beginPath();
          ctx.arc(0, -35, 30, 0, Math.PI * 2);
          ctx.arc(-22, -25, 20, 0, Math.PI * 2);
          ctx.arc(22, -25, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (hairMode === "mohawk") {
          ctx.beginPath();
          ctx.moveTo(-6, -35);
          ctx.lineTo(-12, -60);
          ctx.lineTo(0, -75);
          ctx.lineTo(12, -60);
          ctx.lineTo(6, -35);
          ctx.fill();
          ctx.stroke();
        } else if (hairMode === "ponytail" || hairMode === "braids") {
          // Top coverage
          ctx.beginPath();
          ctx.moveTo(-35, -10);
          ctx.quadraticCurveTo(0, -45, 35, -10);
          ctx.lineTo(35, 0);
          ctx.lineTo(-35, 0);
          ctx.fill();
          ctx.stroke();
        } else if (hairMode === "cyber") {
          ctx.fillStyle = "#06b6d4";
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#06b6d4";
          for (let i = -30; i <= 30; i += 10) {
            ctx.fillRect(i, -55, 6, 25);
          }
          ctx.shadowBlur = 0;
        } else if (hairMode === "anime") {
          ctx.fillStyle = "#fde047";
          ctx.beginPath();
          ctx.moveTo(-35, -25);
          ctx.lineTo(-20, -65);
          ctx.lineTo(-5, -35);
          ctx.lineTo(0, -75);
          ctx.lineTo(10, -35);
          ctx.lineTo(25, -60);
          ctx.lineTo(35, -25);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (hairMode === "crown") {
          ctx.fillStyle = "#facc15";
          ctx.beginPath();
          ctx.moveTo(-25, -35);
          ctx.lineTo(-25, -55);
          ctx.lineTo(-12, -42);
          ctx.lineTo(0, -60);
          ctx.lineTo(12, -42);
          ctx.lineTo(25, -55);
          ctx.lineTo(25, -35);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#ef4444";
          ctx.beginPath(); ctx.arc(0, -50, 3, 0, Math.PI * 2); ctx.fill();
        } else if (hairMode === "headphones") {
          ctx.strokeStyle = "#1e293b";
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(0, -10, 42, Math.PI + 0.2, -0.2);
          ctx.stroke();
          ctx.fillStyle = "#ec4899";
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#ec4899";
          ctx.beginPath(); ctx.roundRect(-46, -18, 12, 28, 6); ctx.fill();
          ctx.beginPath(); ctx.roundRect(34, -18, 12, 28, 6); ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Texture / Shine on hair
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(0, -35, 15, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 5. Bulle d'adieu
      if (showBye) {
        ctx.save();
        ctx.translate(55, -75);
        ctx.scale(1 + Math.sin(frameRef.current * 0.2) * 0.05, 1);
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.roundRect(-45, -28, 90, 45, 18);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-10, 17);
        ctx.lineTo(-15, 35);
        ctx.lineTo(5, 17);
        ctx.fill();
        ctx.fillStyle = "#6366f1";
        ctx.font = 'bold 15px "Fredoka One"';
        ctx.textAlign = "center";
        ctx.fillText("Bye-bye!", 0, 5);
        ctx.restore();
      }

      ctx.restore(); // Restore from main character save (line 61)

      // 6. Player Name Tag - Draw outside of character transformations
      if (playerName) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset EVERYTHING to identity matrix to prevent flipping
        ctx.translate(centerX, centerY + offsetY);
        ctx.font = "bold 20px Fredoka, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 4;
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.fillText(playerName, 0, -60);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [
    character,
    isJumping,
    jumpProgress,
    isBlinking,
    isKicked,
    rotation,
    showBye,
    idleAnimScale,
    previewShirt,
    previewFace,
    previewBackpack,
    isTalking,
    isAngry,
    isUpset,
    playerName,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="drop-shadow-2xl"
    />
  );
};

export default Moro3D;
