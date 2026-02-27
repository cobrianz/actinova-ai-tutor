"use client";

import React, { useState, useRef } from "react";
import {
  Play, Download, ChevronLeft, ChevronRight,
  Settings, Type, Square, Circle, LayoutTemplate,
  X, Layers, Trash2, Maximize, MousePointer2, Shapes, Spline,
  Image as ImageIcon, Table, Maximize2, ChevronDown, MonitorPlay, Boxes,
  Hand, Home, User, Heart, Star, Search, Mail, Phone, Calendar, Clock, MapPin,
  Link, Upload, CornerUpRight, ThumbsUp, ThumbsDown, Eye, Lock, Unlock, XCircle, PenLine,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Copy, ArrowUp, ArrowDown
} from "lucide-react";

const LineIcon = ({ type }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-500 hover:text-black cursor-pointer">
      {type === 'line' && <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="1.5" />}
      {type === 'arrow' && <g><line x1="4" y1="4" x2="19" y2="19" stroke="currentColor" strokeWidth="1.5" /><polyline points="15,19 19,19 19,15" fill="none" stroke="currentColor" strokeWidth="1.5" /></g>}
      {type === 'dot' && <g><line x1="4" y1="4" x2="18" y2="18" stroke="currentColor" strokeWidth="1.5" /><circle cx="19" cy="19" r="2" fill="currentColor" /></g>}
      {type === 'square' && <g><line x1="4" y1="4" x2="18" y2="18" stroke="currentColor" strokeWidth="1.5" /><rect x="18" y="18" width="3" height="3" fill="currentColor" /></g>}
      {type === 'open-arrow' && <g><line x1="4" y1="4" x2="19" y2="19" stroke="currentColor" strokeWidth="1.5" /><polyline points="15,20 20,20 20,15" fill="none" stroke="currentColor" strokeWidth="1.5" /></g>}
      {type === 'elbow' && <path d="M4,4 L4,20 L20,20" fill="none" stroke="currentColor" strokeWidth="1.5" />}
      {type === 'elbow-step' && <path d="M4,4 L12,4 L12,20 L20,20" fill="none" stroke="currentColor" strokeWidth="1.5" />}
      {type === 'curve' && <path d="M4,4 Q4,20 20,20" fill="none" stroke="currentColor" strokeWidth="1.5" />}
      {type === 'curve-s' && <path d="M4,4 C12,4 12,20 20,20" fill="none" stroke="currentColor" strokeWidth="1.5" />}
      {type === 'arc' && <path d="M4,12 A 8 8 0 0 0 20,12" fill="none" stroke="currentColor" strokeWidth="1.5" />}
    </svg>
  );
};
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import pptxgen from "pptxgenjs";

export default function PresentationEditor({ presentation, onBack, onDownload, isDownloading }) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(false);
  const [localPresentation, setLocalPresentation] = useState(presentation);
  const [isDownloadingState, setIsDownloadingState] = useState(false);
  const [zoom, setZoom] = useState(1);
  const editableRef = useRef(null);
  const dragState = useRef(null);

  const [showShapes, setShowShapes] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showEqPicker, setShowEqPicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [showPointerMenu, setShowPointerMenu] = useState(false);
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [allowDrag, setAllowDrag] = useState(true);
  const [tableHoverR, setTableHoverR] = useState(0);
  const [tableHoverC, setTableHoverC] = useState(0);

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null); // { x, y, el }
  const selectedElRef = useRef(null); // currently clicked draggable DOM element

  // Draw-to-insert state
  const [activeTool, setActiveTool] = useState(null); // { type, id, html, config }
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [drawRect, setDrawRect] = useState({ x: 0, y: 0, w: 0, h: 0 });

  // toolbar reference for outside clicks
  const toolbarRef = useRef(null);

  // Toggle functions that close other menus first
  const togglePointerMenu = () => {
    closeAllMenus();
    setShowPointerMenu(s => !s);
  };

  const toggleLayoutPicker = () => {
    closeAllMenus();
    setShowLayoutPicker(s => !s);
  };

  const toggleShapesMenu = () => {
    closeAllMenus();
    setShowShapes(s => !s);
  };

  const toggleConnectorsMenu = () => {
    closeAllMenus();
    setShowConnectors(s => !s);
  };

  const toggleTablePicker = () => {
    closeAllMenus();
    setShowTablePicker(s => !s);
  };

  const toggleEqPicker = () => {
    closeAllMenus();
    setShowEqPicker(s => !s);
  };

  const toggleIconPicker = () => {
    closeAllMenus();
    setShowIconPicker(s => !s);
  };

  const toggleZoomMenu = () => {
    closeAllMenus();
    setShowZoomMenu(s => !s);
  };

  // Close all menus function
  const closeAllMenus = () => {
    setShowPointerMenu(false);
    setShowShapes(false);
    setShowConnectors(false);
    setShowTablePicker(false);
    setShowEqPicker(false);
    setShowIconPicker(false);
    setShowZoomMenu(false);
    setShowLayoutPicker(false);
  };

  // Handle clicking outside to close menus
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      // Don't close if clicking on a menu or trigger button
      const isMenuClick = e.target.closest('[data-menu-trigger]') || e.target.closest('.menu-dropdown');
      if (!isMenuClick && toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        closeAllMenus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [showTextToolbar, setShowTextToolbar] = useState(false);
  const [textToolbarPos, setTextToolbarPos] = useState({ top: 0, left: 0 });
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [selectedFontSize, setSelectedFontSize] = useState("16");
  const [isTextSelected, setIsTextSelected] = useState(false);

  // AI equation modal state
  const [showEqModal, setShowEqModal] = useState(false);
  const [eqModalMode, setEqModalMode] = useState('common'); // 'common' | 'ai'
  const [eqAiPrompt, setEqAiPrompt] = useState('');
  const [eqAiLoading, setEqAiLoading] = useState(false);
  const [eqEditHtml, setEqEditHtml] = useState('');

  // AI layout switching state
  const [isReformattingLayout, setIsReformattingLayout] = useState(false);

  // Contextual element toolbar
  const [selectedElement, setSelectedElement] = useState(null);
  const [elemToolbarPos, setElemToolbarPos] = useState({ top: 0, left: 0 });
  const [selectedElemType, setSelectedElemType] = useState('text'); // 'text'|'shape'|'table'|'equation'|'image'

  const containerRef = useRef(null);

  const slide = localPresentation.slides[currentSlideIndex];

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        toast.error("Error attempting to enable fullscreen");
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // ----- SHAPES -----
  const SHAPE_CATALOG = {
    Rectangle: [
      { id: 'rect', label: 'Rectangle', svg: `<rect x="2" y="6" width="20" height="12" rx="0" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'rect-outline', label: 'Outline Rect', svg: `<rect x="2" y="6" width="20" height="12" rx="0" fill="none" stroke="currentColor" stroke-width="2.5"/>` },
      { id: 'rounded-rect', label: 'Rounded', svg: `<rect x="2" y="6" width="20" height="12" rx="4" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'snip-rect', label: 'Snip Corner', svg: `<path d="M6,6 L22,6 L22,18 L2,18 L2,6 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'parallelogram', label: 'Parallelogram', svg: `<path d="M6,18 L22,18 L18,6 L2,6 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'trapezoid', label: 'Trapezoid', svg: `<path d="M5,18 L19,18 L15,6 L9,6 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'rect-sm', label: 'Small Rect', svg: `<rect x="6" y="8" width="12" height="8" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'rect-wide', label: 'Wide Rect', svg: `<rect x="1" y="8" width="22" height="8" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'rect-tall', label: 'Tall Rect', svg: `<rect x="8" y="2" width="8" height="20" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'double-rect', label: 'Double Rect', svg: `<rect x="2" y="5" width="14" height="10" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="8" y="9" width="14" height="10" fill="none" stroke="currentColor" stroke-width="1.2"/>` },
    ],
    'Other Shapes': [
      { id: 'circle', label: 'Circle', svg: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'triangle', label: 'Triangle', svg: `<path d="M12,4 L21,20 L3,20 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'right-triangle', label: 'Right Triangle', svg: `<path d="M3,20 L21,20 L3,4 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'diamond', label: 'Diamond', svg: `<path d="M12,3 L21,12 L12,21 L3,12 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'pentagon', label: 'Pentagon', svg: `<path d="M12,3 L21,9 L18,20 L6,20 L3,9 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'hexagon', label: 'Hexagon', svg: `<path d="M7,3 L17,3 L22,12 L17,21 L7,21 L2,12 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'octagon', label: 'Octagon', svg: `<path d="M8,2 L16,2 L22,8 L22,16 L16,22 L8,22 L2,16 L2,8 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'ellipse', label: 'Ellipse', svg: `<ellipse cx="12" cy="12" rx="10" ry="6" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'pie-slice', label: 'Pie Slice', svg: `<path d="M12,12 L12,3 A9,9 0 0,1 21,12 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'chevron', label: 'Chevron', svg: `<path d="M2,8 L12,8 L16,12 L12,16 L2,16 L6,12 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'cylinder', label: 'Cylinder', svg: `<ellipse cx="12" cy="6" rx="8" ry="3" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="4" y1="6" x2="4" y2="18" stroke="currentColor" stroke-width="1.5"/><line x1="20" y1="6" x2="20" y2="18" stroke="currentColor" stroke-width="1.5"/><ellipse cx="12" cy="18" rx="8" ry="3" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'cube', label: 'Cube', svg: `<path d="M6,4 L18,4 L22,8 L22,20 L10,20 L6,16 Z M6,4 L6,16 M18,4 L22,8 L10,8 L6,4 M10,8 L10,20" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'frame', label: 'Frame', svg: `<rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="6" y="6" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1"/>` },
      { id: 'donut', label: 'Donut/Ring', svg: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'arc', label: 'Arc', svg: `<path d="M5,18 A9,9 0 0,1 19,18" fill="none" stroke="currentColor" stroke-width="2"/>` },
      { id: 'brace', label: 'Brace', svg: `<path d="M8,3 Q4,3 4,7 Q4,12 2,12 Q4,12 4,17 Q4,21 8,21" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'arrow-right', label: 'Arrow Right', svg: `<path d="M3,12 L18,12 M13,7 L19,12 L13,17" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'double-arrow', label: 'Double Arrow', svg: `<path d="M21,12 L16,7 M21,12 L16,17 M3,12 L8,7 M3,12 L8,17 M3,12 L21,12" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'callout', label: 'Callout', svg: `<path d="M3,3 L21,3 L21,17 L8,17 L4,21 L6,17 L3,17 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'speech-bubble', label: 'Speech Bubble', svg: `<path d="M12,3 A9,7 0 0 1 12,3 A9,7 0 0 1 12,17 L8,21 L10,17 A9,7 0 0 1 12,3 Z" fill="none" stroke="currentColor" stroke-width="1.5"/><ellipse cx="12" cy="10" rx="9" ry="7" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'rounded-bubble', label: 'Round Bubble', svg: `<circle cx="12" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8,18 L6,22 L12,18" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
    ],
    Decoration: [
      { id: 'heart', label: 'Heart', svg: `<path d="M12,21 C12,21 3,15 3,9 A4,4 0 0,1 12,8 A4,4 0 0,1 21,9 C21,15 12,21 12,21 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'lightning', label: 'Lightning', svg: `<path d="M13,2 L7,13 L12,13 L11,22 L17,11 L12,11 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'star-4', label: '4-Point Star', svg: `<path d="M12,2 L14,9 L21,9 L16,13 L18,20 L12,16 L6,20 L8,13 L3,9 L10,9 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'star-5', label: '5-Point Star', svg: `<path d="M12,2 L13.5,8.7 L21,8.7 L15,13 L17,20 L12,16 L7,20 L9,13 L3,8.7 L10.5,8.7 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'star-6', label: '6-Point Star', svg: `<path d="M12,2 L14,8 L20,6 L16,11 L22,13 L16,15 L20,20 L14,18 L12,22 L10,18 L4,20 L8,15 L2,13 L8,11 L4,6 L10,8 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'sun', label: 'Sun', svg: `<circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="12" x2="5" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="19" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="4.9" y1="4.9" x2="7" y2="7" stroke="currentColor" stroke-width="1.5"/><line x1="17" y1="17" x2="19.1" y2="19.1" stroke="currentColor" stroke-width="1.5"/><line x1="19.1" y1="4.9" x2="17" y2="7" stroke="currentColor" stroke-width="1.5"/><line x1="7" y1="17" x2="4.9" y2="19.1" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'moon', label: 'Moon', svg: `<path d="M21,12.8 A9,9 0 1,1 11.2,3 A7,7 0 0,0 21,12.8 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'cloud', label: 'Cloud', svg: `<path d="M6,19 A4,4 0 0,1 6,11 A5,5 0 0,1 16,8 A4,4 0 0,1 20,11 A3,3 0 0,1 18,19 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'starburst', label: 'Starburst', svg: `<path d="M12,2 L13,8 L17,4 L15,10 L21,9 L17,13 L21,17 L15,16 L17,22 L13,18 L12,22 L11,18 L7,22 L9,16 L3,17 L7,13 L3,9 L9,10 L7,4 L11,8 Z" fill="none" stroke="currentColor" stroke-width="1"/>` },
      { id: 'no-entry', label: 'No Entry', svg: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" stroke-width="2"/>` },
      { id: 'flower', label: 'Flower', svg: `<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><ellipse cx="12" cy="6" rx="2" ry="3" fill="none" stroke="currentColor" stroke-width="1.2"/><ellipse cx="12" cy="18" rx="2" ry="3" fill="none" stroke="currentColor" stroke-width="1.2"/><ellipse cx="6" cy="12" rx="3" ry="2" fill="none" stroke="currentColor" stroke-width="1.2"/><ellipse cx="18" cy="12" rx="3" ry="2" fill="none" stroke="currentColor" stroke-width="1.2"/>` },
      { id: 'badge', label: 'Badge', svg: `<path d="M12,2 L15,8 L22,9 L17,14 L18,21 L12,18 L6,21 L7,14 L2,9 L9,8 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
      { id: 'medal', label: 'Medal', svg: `<circle cx="12" cy="15" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9,9 L7,2 L12,5 L17,2 L15,9" fill="none" stroke="currentColor" stroke-width="1.5"/>` },
    ],
  };

  const makeShapeHtml = (shapeId) => {
    const cat = Object.values(SHAPE_CATALOG).flat();
    const s = cat.find(x => x.id === shapeId);
    if (!s) return '';
    // Use SVG for most shapes
    if (shapeId === 'circle') return `<div class="draggable slide-element" data-x="0" data-y="0" data-type="shape" style="width:120px;height:120px;border-radius:50%;border:2px solid #374151;background:#eef2ff;display:inline-flex;align-items:center;justify-content:center;margin:6px;position:absolute;cursor:grab;" contenteditable="false"></div>`;
    if (shapeId === 'rect' || shapeId === 'rectangle') return `<div class="draggable slide-element" data-x="0" data-y="0" data-type="shape" style="width:200px;height:120px;border:2px solid #374151;background:#eef2ff;display:inline-flex;align-items:center;justify-content:center;margin:6px;position:absolute;cursor:grab;" contenteditable="false"></div>`;
    if (shapeId === 'rounded-rect') return `<div class="draggable slide-element" data-x="0" data-y="0" data-type="shape" style="width:200px;height:120px;border-radius:16px;border:2px solid #374151;background:#fff7ed;display:inline-flex;align-items:center;justify-content:center;margin:6px;position:absolute;cursor:grab;" contenteditable="false"></div>`;
    // SVG shapes
    return `<span class="draggable slide-element" data-x="0" data-y="0" data-type="shape" style="display:inline-block;margin:6px;position:absolute;cursor:grab;" contenteditable="false"><svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#374151" style="display:block;">${s.svg}</svg></span>`;
  };

  // --- Draw-to-Insert Core Logic ---
  const handleSlideMouseDown = (e) => {
    if (!activeTool) return;

    const rect = e.currentTarget.getBoundingClientRect();
    // Account for zoom when calculating internal slide coordinates
    const sx = (e.clientX - rect.left) / zoom;
    const sy = (e.clientY - rect.top) / zoom;

    setIsDrawing(true);
    setDrawStart({ x: sx, y: sy });
    setDrawRect({ x: sx, y: sy, w: 0, h: 0 });
    e.preventDefault();
  };

  const handleSlideMouseMove = (e) => {
    if (!isDrawing) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const curX = (e.clientX - rect.left) / zoom;
    const curY = (e.clientY - rect.top) / zoom;

    const x = Math.min(drawStart.x, curX);
    const y = Math.min(drawStart.y, curY);
    const w = Math.abs(curX - drawStart.x);
    const h = Math.abs(curY - drawStart.y);

    setDrawRect({ x, y, w, h });
  };

  const handleSlideMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Finalize insertion
    finalizeToolInsertion(drawRect);
    setActiveTool(null);
  };

  const finalizeToolInsertion = ({ x, y, w, h }) => {
    if (!activeTool) return;

    const width = Math.max(w, 20);
    const height = Math.max(h, 20);

    let html = '';
    if (activeTool.type === 'shape') {
      const sId = activeTool.id;
      const cat = Object.values(SHAPE_CATALOG).flat();
      const s = cat.find(v => v.id === sId);

      if (sId === 'circle') {
        html = `<div class="draggable slide-element" data-x="${x}" data-y="${y}" data-type="shape" style="width:${width}px;height:${height}px;border-radius:50%;border:2px solid #374151;background:#eef2ff;position:absolute;transform:translate(${x}px, ${y}px);cursor:grab;" contenteditable="false"></div>`;
      } else if (sId === 'rect' || sId === 'rectangle') {
        html = `<div class="draggable slide-element" data-x="${x}" data-y="${y}" data-type="shape" style="width:${width}px;height:${height}px;border:2px solid #374151;background:#eef2ff;position:absolute;transform:translate(${x}px, ${y}px);cursor:grab;" contenteditable="false"></div>`;
      } else if (s) {
        html = `<span class="draggable slide-element" data-x="${x}" data-y="${y}" data-type="shape" style="display:inline-block;position:absolute;transform:translate(${x}px, ${y}px);cursor:grab;width:${width}px;height:${height}px;" contenteditable="false"><svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#374151" style="display:block;">${s.svg}</svg></span>`;
      }
    } else if (activeTool.type === 'text') {
      html = `<div class="draggable slide-element" data-x="${x}" data-y="${y}" data-type="text" style="width:${width}px;min-height:${height}px;position:absolute;transform:translate(${x}px, ${y}px);cursor:grab;padding:8px;font-size:18px;" contenteditable="true">New Text</div>`;
    } else if (activeTool.type === 'equation') {
      html = `<div class="draggable slide-element" data-x="${x}" data-y="${y}" data-type="equation" style="width:${width}px;min-height:${height}px;position:absolute;transform:translate(${x}px, ${y}px);cursor:grab;padding:12px;display:flex;align-items:center;justify-content:center;font-family:serif;font-size:1.5rem;" contenteditable="false">${activeTool.html}</div>`;
    }

    if (html) {
      // Direct DOM insertion is more reliable than insertHTML in scaled containers
      const container = document.getElementById(`editable-${currentSlideIndex}`);
      if (container) {
        const div = document.createElement('div');
        div.innerHTML = html;
        const newEl = div.firstChild;
        container.appendChild(newEl);
        syncContentToState();
        toast.success(`${activeTool.type} inserted`);
      }
    }
  };

  const insertShapeType = (shapeId) => {
    setActiveTool({ type: 'shape', id: shapeId });
    closeAllMenus();
    toast.info('Draw on the slide to place the shape', { duration: 2000 });
  };

  const startTextInsertion = () => {
    setActiveTool({ type: 'text' });
    closeAllMenus();
    toast.info('Draw text area on the slide', { duration: 2000 });
  };

  const insertEquationTool = (html) => {
    setActiveTool({ type: 'equation', html });
    closeAllMenus();
    toast.info('Draw area for the equation', { duration: 2000 });
  };

  const insertConnectorType = (kind) => {
    focusEditable();
    let svg = '';
    if (kind === 'line') svg = '<svg width="200" height="20" class="draggable slide-element" data-x="0" data-y="0" data-type="connector" style="display:inline-block;position:absolute;cursor:grab;"><line x1="0" y1="10" x2="200" y2="10" stroke="#374151" stroke-width="2"/></svg>';
    if (kind === 'arrow') svg = '<svg width="200" height="20" class="draggable slide-element" data-x="0" data-y="0" data-type="connector" style="display:inline-block;position:absolute;cursor:grab;"><line x1="0" y1="10" x2="180" y2="10" stroke="#374151" stroke-width="2"/><polygon points="180,5 195,10 180,15" fill="#374151"/></svg>';
    if (kind === 'double-arrow') svg = '<svg width="200" height="20" class="draggable slide-element" data-x="0" data-y="0" data-type="connector" style="display:inline-block;position:absolute;cursor:grab;"><line x1="20" y1="10" x2="180" y2="10" stroke="#374151" stroke-width="2"/><polygon points="20,5 5,10 20,15" fill="#374151"/><polygon points="180,5 195,10 180,15" fill="#374151"/></svg>';
    if (kind === 'curve') svg = '<svg width="200" height="50" class="draggable slide-element" data-x="0" data-y="0" data-type="connector" style="display:inline-block;position:absolute;cursor:grab;"><path d="M0,40 C60,0 140,80 200,40" stroke="#374151" stroke-width="2" fill="none"/></svg>';
    if (kind === 'elbow') svg = '<svg width="100" height="100" class="draggable slide-element" data-x="0" data-y="0" data-type="connector" style="display:inline-block;position:absolute;cursor:grab;"><path d="M10,10 L10,90 L90,90" stroke="#374151" stroke-width="2" fill="none"/></svg>';
    if (svg) {
      execFormat('insertHTML', svg);
      setTimeout(syncContentToState, 120);
    }
    closeAllMenus();
  };

  const commonEquations = [
    { title: "Newton's Second Law", html: `<span style="font-style:italic;"><i>F</i> = <i>m</i><i>a</i></span>` },
    { title: 'Pythagorean Theorem', html: `<span style="font-style:italic;"><i>a</i><sup>2</sup> + <i>b</i><sup>2</sup> = <i>c</i><sup>2</sup></span>` },
    { title: 'Quadratic Formula', html: `<span style="font-style:italic;"><i>x</i> = <span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 2px;"><span style="border-bottom:1.5px solid currentColor;padding:0 4px;">−<i>b</i> ± √(<i>b</i><sup>2</sup>−4<i>ac</i>)</span><span style="padding:0 4px;">2<i>a</i></span></span></span>` },
    { title: 'Area of Circle', html: `<span style="font-style:italic;"><i>A</i> = π<i>r</i><sup>2</sup></span>` },
    { title: 'Circumference', html: `<span style="font-style:italic;"><i>C</i> = 2π<i>r</i></span>` },
    { title: "Euler's Identity", html: `<span style="font-style:italic;"><i>e</i><sup>i π</sup> + 1 = 0</span>` },
    { title: "Einstein's Mass-Energy", html: `<span style="font-style:italic;"><i>E</i> = <i>m</i><i>c</i><sup>2</sup></span>` },
    { title: 'Ohm\'s Law', html: `<span style="font-style:italic;"><i>V</i> = <i>I</i><i>R</i></span>` },
    { title: "Law of Cosines", html: `<span style="font-style:italic;"><i>c</i><sup>2</sup> = <i>a</i><sup>2</sup> + <i>b</i><sup>2</sup> − 2<i>ab</i>cos(<i>C</i>)</span>` },
    { title: 'Sine Rule', html: `<span style="font-style:italic;"><span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;"><span style="border-bottom:1.5px solid currentColor;padding:0 3px;"><i>a</i></span><span style="padding:0 3px;">sin <i>A</i></span></span> = <span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;"><span style="border-bottom:1.5px solid currentColor;padding:0 3px;"><i>b</i></span><span style="padding:0 3px;">sin <i>B</i></span></span></span>` },
    { title: 'Compound Interest', html: `<span style="font-style:italic;"><i>A</i> = <i>P</i><span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;"><span style="padding:0 2px;">(1 + <span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;"><span style="border-bottom:1.5px solid currentColor;padding:0 2px;"><i>r</i></span><span style="padding:0 2px;"><i>n</i></span></span>)</span></span><sup><i>nt</i></sup></span>` },
    { title: 'Bayes Theorem', html: `<span style="font-style:italic;"><i>P</i>(<i>A</i>|<i>B</i>) = <span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;"><span style="border-bottom:1.5px solid currentColor;padding:0 3px;"><i>P</i>(<i>B</i>|<i>A</i>)<i>P</i>(<i>A</i>)</span><span style="padding:0 3px;"><i>P</i>(<i>B</i>)</span></span></span>` },
    { title: 'Standard Deviation', html: `<span style="font-style:italic;">σ = √<span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;"><span style="border-bottom:1.5px solid currentColor;padding:0 3px;">Σ(<i>x</i>−μ)<sup>2</sup></span><span style="padding:0 3px;"><i>N</i></span></span></span>` },
  ];

  const insertEquation = (eqHtml) => {
    insertEquationTool(eqHtml);
    setShowEqModal(false);
  };

  const generateAiEquation = async () => {
    if (!eqAiPrompt.trim()) return;
    setEqAiLoading(true);
    try {
      const res = await fetch('/api/generate-equation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: eqAiPrompt })
      });
      const data = await res.json();
      if (data.html) {
        setEqEditHtml(data.html);
        setEqModalMode('edit');
      } else {
        toast.error(data.error || 'Failed to generate equation');
      }
    } catch (e) {
      toast.error('AI equation generation failed');
    } finally {
      setEqAiLoading(false);
    }
  };

  const iconList = ['★', '❤', '⚙', '🔍', '📷', '📊', '📌', '✅', '➕', '🔔', '📎', '🔒'];
  const insertIcon = (ic) => {
    focusEditable();
    execFormat('insertHTML', `<span class="draggable slide-element" data-x="0" data-y="0" data-type="icon" contenteditable="false" style="display:inline-block;margin:4px;font-size:28px;position:absolute;cursor:grab;">${ic}</span>`);
    setTimeout(syncContentToState, 120);
    closeAllMenus();
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const bgStyle = slide.background?.type === "gradient"
    ? { background: slide.background.gradient }
    : { backgroundColor: slide.background?.color || "#ffffff" };

  const applyLayout = (layoutId) => {
    let html = '';
    const defW = '100%';
    const defH = '100%';

    switch (layoutId) {
      case 'title-top':
        html = `
          <div style="width:${defW}; height:${defH}; padding:8%; box-sizing:border-box; display:flex; flex-direction:column; align-items:center;">
            <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="width:80%; text-align:center; position:relative; cursor:grab; margin-bottom: 2rem;">
              <h1 style="font-size:3rem; margin:0;">Title Goes Here</h1>
              <p style="font-size:1.5rem; color:#666; margin-top:0.5rem;">Subtitle or descriptor</p>
            </div>
            <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="width:80%; flex-grow:1; border:2px dashed #e5e7eb; border-radius:12px; display:flex; align-items:center; justify-center; position:relative; cursor:grab;">
               <p style="text-align:center; width:100%; color:#9ca3af;">Click to add text, image, or content</p>
            </div>
          </div>
        `;
        break;
      case 'title-left':
        html = `
          <div style="width:${defW}; height:${defH}; padding:8%; box-sizing:border-box; display:flex; flex-direction:row; gap:4rem;">
            <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="width:40%; display:flex; flex-direction:column; justify-content:center; position:relative; cursor:grab;">
              <h2 style="font-size:3rem; margin:0;">Left Title Area</h2>
              <p style="font-size:1.5rem; color:#666; margin-top:0.5rem;">Subtitle or descriptor</p>
            </div>
            <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="width:60%; border:2px dashed #e5e7eb; border-radius:12px; display:flex; align-items:center; justify-center; position:relative; cursor:grab;">
               <p style="text-align:center; width:100%; color:#9ca3af;">Content block</p>
            </div>
          </div>
        `;
        break;
      case 'title-right':
        html = `
          <div style="width:${defW}; height:${defH}; padding:8%; box-sizing:border-box; display:flex; flex-direction:row; gap:4rem;">
            <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="width:60%; border:2px dashed #e5e7eb; border-radius:12px; display:flex; align-items:center; justify-center; position:relative; cursor:grab;">
               <p style="text-align:center; width:100%; color:#9ca3af;">Content block</p>
            </div>
            <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="width:40%; display:flex; flex-direction:column; justify-content:center; position:relative; cursor:grab;">
              <h2 style="font-size:3rem; margin:0;">Right Title Area</h2>
              <p style="font-size:1.5rem; color:#666; margin-top:0.5rem;">Subtitle or descriptor</p>
            </div>
          </div>
        `;
        break;
      case 'left-image-title-top':
        html = `
          <div style="width:${defW}; height:${defH}; padding:6%; box-sizing:border-box; display:flex; flex-direction:column;">
            <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="width:100%; position:relative; cursor:grab; margin-bottom: 2rem;">
              <h2 style="font-size:2.5rem; margin:0;">Section Title</h2>
            </div>
            <div style="display:flex; flex-direction:row; gap:3rem; height:100%;">
              <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="width:50%; background:#f3f4f6; border-radius:12px; display:flex; align-items:center; justify-center; position:relative; cursor:grab;">
                 <p style="text-align:center; width:100%; color:#9ca3af;">[ Image Placeholder ]</p>
              </div>
              <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="width:50%; position:relative; cursor:grab; padding-top:1rem;">
                 <ul style="font-size:1.5rem; color:#4b5563; line-height:1.8;">
                   <li>First bullet point here</li>
                   <li>Second bullet point details</li>
                   <li>Third description item</li>
                 </ul>
              </div>
            </div>
          </div>
        `;
        break;
      case 'right-image-title-top':
        html = `
          <div style="width:${defW}; height:${defH}; padding:6%; box-sizing:border-box; display:flex; flex-direction:column;">
            <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="width:100%; position:relative; cursor:grab; margin-bottom: 2rem;">
              <h2 style="font-size:2.5rem; margin:0;">Secondary Section</h2>
            </div>
            <div style="display:flex; flex-direction:row; gap:3rem; height:100%;">
              <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="width:50%; position:relative; cursor:grab; padding-top:1rem;">
                 <p style="font-size:1.5rem; color:#4b5563; line-height:1.6;">Detailed description text goes here in this block. You can add as much text as needed to explain your point.</p>
              </div>
              <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="width:50%; background:#f3f4f6; border-radius:12px; display:flex; align-items:center; justify-center; position:relative; cursor:grab;">
                 <p style="text-align:center; width:100%; color:#9ca3af;">[ Image Placeholder ]</p>
              </div>
            </div>
          </div>
        `;
        break;
      case 'left-image':
        html = `
          <div style="width:${defW}; height:${defH}; display:flex; flex-direction:row;">
            <div class="draggable" data-x="0" data-y="0" contenteditable="false" style="width:50%; height:100%; background:#e5e7eb; display:flex; align-items:center; justify-center; position:relative; cursor:grab;">
               <p style="text-align:center; width:100%; color:#9ca3af;">[ Full Height Image ]</p>
            </div>
            <div style="width:50%; height:100%; padding:8%; box-sizing:border-box; display:flex; flex-direction:column; justify-content:center;">
              <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="position:relative; cursor:grab;">
                 <h2 style="font-size:3rem; margin:0 0 1rem 0;">Key Takeaway</h2>
                 <p style="font-size:1.5rem; color:#4b5563; line-height:1.6;">This layout uses a striking full-height left column for imagery, paired with a right column for supporting text and details.</p>
              </div>
            </div>
          </div>
        `;
        break;
      case 'right-image':
        html = `
          <div style="width:${defW}; height:${defH}; display:flex; flex-direction:row;">
            <div style="width:50%; height:100%; padding:8%; box-sizing:border-box; display:flex; flex-direction:column; justify-content:center;">
              <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="position:relative; cursor:grab;">
                 <h2 style="font-size:3rem; margin:0 0 1rem 0;">Primary Focus</h2>
                 <p style="font-size:1.5rem; color:#4b5563; line-height:1.6;">Use the left side for heavy text or metrics that draw the eye immediately, supported by a full bleed image on the right.</p>
              </div>
            </div>
            <div class="draggable" data-x="0" data-y="0" contenteditable="false" style="width:50%; height:100%; background:#e5e7eb; display:flex; align-items:center; justify-center; position:relative; cursor:grab;">
               <p style="text-align:center; width:100%; color:#9ca3af;">[ Full Height Image ]</p>
            </div>
          </div>
        `;
        break;
      case 'full-background':
        html = `
          <div style="width:${defW}; height:${defH}; background:#1f2937; color:white; display:flex; align-items:center; justify-content:center; padding:10%; box-sizing:border-box; position:relative;">
             <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="text-align:center; z-index:10; position:relative; cursor:grab;">
                <h1 style="font-size:4.5rem; font-weight:bold; margin:0 0 1rem 0; text-shadow: 0 4px 12px rgba(0,0,0,0.5);">Major Impact</h1>
                <p style="font-size:1.8rem; opacity:0.9; text-shadow: 0 2px 8px rgba(0,0,0,0.5);">Use this layout for bold statements over images.</p>
             </div>
             <div class="absolute inset-0 bg-black/40 z-0"></div>
          </div>
        `;
        break;
      case 'three-cols':
        html = `
          <div style="width:${defW}; height:${defH}; padding:8%; box-sizing:border-box; display:flex; flex-direction:column;">
            <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="width:100%; text-align:center; margin-bottom:4rem; position:relative; cursor:grab;">
              <h2 style="font-size:3rem; margin:0;">Three Core Pillars</h2>
            </div>
            <div style="display:flex; flex-direction:row; gap:2rem; flex:1;">
               <!-- Col 1 -->
               <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="flex:1; display:flex; flex-direction:column; align-items:center; text-align:center; position:relative; cursor:grab;">
                  <div style="width:80px; height:80px; border-radius:50%; background:#bfdbfe; margin-bottom:1.5rem;"></div>
                  <h3 style="font-size:1.5rem; margin:0 0 1rem 0;">Phase One</h3>
                  <p style="color:#6b7280; font-size:1.1rem; line-height:1.5;">Initiation and discovery details go here.</p>
               </div>
               <!-- Col 2 -->
               <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="flex:1; display:flex; flex-direction:column; align-items:center; text-align:center; position:relative; cursor:grab;">
                  <div style="width:80px; height:80px; border-radius:50%; background:#fef08a; margin-bottom:1.5rem;"></div>
                  <h3 style="font-size:1.5rem; margin:0 0 1rem 0;">Phase Two</h3>
                  <p style="color:#6b7280; font-size:1.1rem; line-height:1.5;">Development and rigorous testing.</p>
               </div>
               <!-- Col 3 -->
               <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="flex:1; display:flex; flex-direction:column; align-items:center; text-align:center; position:relative; cursor:grab;">
                  <div style="width:80px; height:80px; border-radius:50%; background:#bbf7d0; margin-bottom:1.5rem;"></div>
                  <h3 style="font-size:1.5rem; margin:0 0 1rem 0;">Phase Three</h3>
                  <p style="color:#6b7280; font-size:1.1rem; line-height:1.5;">Launch and continued refinement step.</p>
               </div>
            </div>
          </div>
        `;
        break;
      case 'four-grid':
        html = `
          <div style="width:${defW}; height:${defH}; padding:6%; box-sizing:border-box; display:grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap:2rem;">
            <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:2rem; position:relative; cursor:grab;">
               <h3 style="font-size:1.8rem; margin:0 0 1rem 0;">Quadrant One</h3>
               <p style="color:#64748b; font-size:1.2rem;">Detailed metrics and stats for Q1 performance.</p>
            </div>
            <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:2rem; position:relative; cursor:grab;">
               <h3 style="font-size:1.8rem; margin:0 0 1rem 0;">Quadrant Two</h3>
               <p style="color:#64748b; font-size:1.2rem;">Detailed metrics and stats for Q2 performance.</p>
            </div>
            <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:2rem; position:relative; cursor:grab;">
               <h3 style="font-size:1.8rem; margin:0 0 1rem 0;">Quadrant Three</h3>
               <p style="color:#64748b; font-size:1.2rem;">Detailed metrics and stats for Q3 performance.</p>
            </div>
            <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:2rem; position:relative; cursor:grab;">
               <h3 style="font-size:1.8rem; margin:0 0 1rem 0;">Quadrant Four</h3>
               <p style="color:#64748b; font-size:1.2rem;">Detailed metrics and stats for Q4 performance.</p>
            </div>
          </div>
        `;
        break;
      case 'top-banner':
        html = `
          <div style="width:${defW}; height:${defH}; display:flex; flex-direction:column; background:#f9fafb;">
            <div class="draggable" data-x="0" data-y="0" contenteditable="false" style="width:100%; height:35%; background:#3b82f6; position:relative; cursor:grab; display:flex; align-items:center; justify-content:center;">
               <p style="color:white; opacity:0.8;">[ Header Banner Image or Color ]</p>
            </div>
            <div style="flex:1; padding:4rem 8%; box-sizing:border-box;">
               <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="background:white; margin-top:-6rem; padding:3rem; border-radius:16px; box-shadow:0 10px 25px rgba(0,0,0,0.05); position:relative; cursor:grab;">
                 <h2 style="font-size:2.5rem; margin:0 0 1rem 0;">Elevated Content Block</h2>
                 <p style="font-size:1.4rem; color:#4b5563; line-height:1.7;">A modern layout using a dropped content card over a strong visual header banner to create visual hierarchy and depth.</p>
               </div>
            </div>
          </div>
        `;
        break;
      case 'split-horiz':
        html = `
          <div style="width:${defW}; height:${defH}; display:flex; flex-direction:column;">
            <div style="width:100%; height:50%; padding:6%; box-sizing:border-box; display:flex; flex-direction:column; justify-content:center; align-items:center; border-bottom:1px solid #e5e7eb;">
              <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="text-align:center; position:relative; cursor:grab;">
                 <h2 style="font-size:3.5rem; margin:0;">Top Section Header</h2>
              </div>
            </div>
            <div style="width:100%; height:50%; padding:6%; box-sizing:border-box; background:#f9fafb; display:flex; align-items:center; justify-center;">
               <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="text-align:center; width:100%; position:relative; cursor:grab;">
                 <p style="font-size:1.5rem; color:#6b7280; max-width:800px; margin:0 auto;">Use the bottom half to elaborate on the top section, perhaps featuring a quote, a detailed statistic, or supporting graphic.</p>
               </div>
            </div>
          </div>
        `;
        break;
      case 'caption-bottom':
        html = `
          <div style="width:${defW}; height:${defH}; padding:4%; box-sizing:border-box; display:flex; flex-direction:column; gap:2rem;">
            <div class="draggable" data-x="0" data-y="0" contenteditable="false" style="width:100%; flex:1; border-radius:12px; background:#e5e7eb; display:flex; align-items:center; justify-center; position:relative; cursor:grab;">
               <p style="text-align:center; width:100%; color:#9ca3af;">[ Main Display Graphic ]</p>
            </div>
            <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="width:100%; text-align:center; position:relative; cursor:grab; padding-bottom:1rem;">
               <p style="font-size:1.2rem; color:#6b7280; margin:0;">Fig 1. Detailed caption explaining the diagram, chart, or photograph above.</p>
            </div>
          </div>
        `;
        break;
      case 'dual-list':
        html = `
          <div style="width:${defW}; height:${defH}; padding:8%; box-sizing:border-box; display:flex; flex-direction:column;">
            <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="width:100%; margin-bottom:3rem; position:relative; cursor:grab;">
              <h2 style="font-size:3rem; margin:0;">Comparison</h2>
            </div>
            <div style="display:flex; flex-direction:row; gap:4rem; flex:1;">
               <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="flex:1; position:relative; cursor:grab; border-right:2px solid #f3f4f6; padding-right:4rem;">
                  <h3 style="font-size:1.8rem; color:#3b82f6; margin:0 0 1.5rem 0;">Option A</h3>
                  <ul style="font-size:1.4rem; color:#4b5563; line-height:2.2;">
                    <li>High initial cost</li>
                    <li>Faster deployment</li>
                    <li>Managed infrastructure</li>
                  </ul>
               </div>
               <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="flex:1; position:relative; cursor:grab;">
                  <h3 style="font-size:1.8rem; color:#10b981; margin:0 0 1.5rem 0;">Option B</h3>
                  <ul style="font-size:1.4rem; color:#4b5563; line-height:2.2;">
                    <li>Lower recurring fees</li>
                    <li>Slightly longer setup</li>
                    <li>Full customizability</li>
                  </ul>
               </div>
            </div>
          </div>
        `;
        break;
      case 'centered-quote':
        html = `
          <div style="width:${defW}; height:${defH}; background:#fcfcfc; display:flex; align-items:center; justify-content:center; padding:15%; box-sizing:border-box; border:1px solid #f3f4f6;">
             <div class="draggable" data-x="0" data-y="0" contenteditable="true" style="text-align:center; position:relative; cursor:grab;">
                <div style="font-size:8rem; font-family:serif; color:#d1d5db; line-height:0.2; transform:translateY(-1rem);">"</div>
                <h2 style="font-size:3.5rem; font-family:serif; font-style:italic; font-weight:normal; margin:0 0 2rem 0; color:#111827; line-height:1.2;">Design is not just what it looks like and feels like. Design is how it works.</h2>
                <p style="font-size:1.5rem; color:#6b7280; font-weight:600; text-transform:uppercase; letter-spacing:1px; margin:0;">— Steve Jobs</p>
             </div>
          </div>
        `;
        break;
      case 'blank':
        html = `<div style="width:${defW}; height:${defH}; padding:40px; box-sizing:border-box; background:white;"></div>`;
        break;
    }

    // Check if there's existing content we should reflow with AI
    const currentHtml = localPresentation.slides[currentSlideIndex]?.htmlContent || '';
    const hasExistingContent = currentHtml.replace(/<[^>]*>/g, '').trim().length > 20;

    if (hasExistingContent && html) {
      // Use AI to reflow existing content into new layout
      setIsReformattingLayout(true);
      closeAllMenus();
      fetch('/api/reformat-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalHtml: currentHtml,
          targetLayoutHtml: html,
          layoutName: layoutId
        })
      })
        .then(r => r.json())
        .then(data => {
          if (data.html) {
            const updated = { ...localPresentation };
            updated.slides[currentSlideIndex].htmlContent = data.html;
            setLocalPresentation(updated);
            toast.success('Layout applied with your content!');
          } else {
            // Fallback to blank template
            const updated = { ...localPresentation };
            updated.slides[currentSlideIndex].htmlContent = html;
            setLocalPresentation(updated);
          }
          setTimeout(focusEditable, 100);
        })
        .catch(() => {
          // Fallback to blank template on error
          const updated = { ...localPresentation };
          updated.slides[currentSlideIndex].htmlContent = html;
          setLocalPresentation(updated);
          setTimeout(focusEditable, 100);
          toast.error('Could not reflow content, blank layout applied.');
        })
        .finally(() => setIsReformattingLayout(false));
    } else if (html) {
      // No existing content – just stamp in the blank template
      const updated = { ...localPresentation };
      updated.slides[currentSlideIndex].htmlContent = html;
      setLocalPresentation(updated);
      setTimeout(focusEditable, 100);
      closeAllMenus();
    }
  };


  const handleNext = () => {
    if (currentSlideIndex < localPresentation.slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const handleClientDownload = async () => {
    try {
      setIsDownloadingState(true);
      toast.info("Generating beautiful PPTX... please wait.");

      const prs = new pptxgen();
      prs.defineLayout({ name: "DEFAULT", width: 10, height: 5.625 }); // 16:9
      prs.layout = "DEFAULT";

      for (let i = 0; i < localPresentation.slides.length; i++) {
        const slideElement = document.getElementById(`export-slide-${i}`);
        if (slideElement) {
          // Force the element to be visible for the canvas
          const canvas = await html2canvas(slideElement, {
            scale: 2, // High DPI
            useCORS: true,
            backgroundColor: null
          });

          const imgData = canvas.toDataURL("image/png");
          const newSlide = prs.addSlide();
          newSlide.addImage({ data: imgData, x: 0, y: 0, w: "100%", h: "100%" });
        }
      }

      const fileName = `${localPresentation.title.replace(/\s+/g, "_")}_${new Date().getTime()}.pptx`;
      await prs.writeFile({ fileName });
      toast.success("Download complete!");

    } catch (err) {
      console.error(err);
      toast.error("Error generating PPTX.");
    } finally {
      setIsDownloadingState(false);
    }
  };

  // Quick Editor Actions
  const updateSlideBackground = (gradient) => {
    const updated = { ...localPresentation };
    updated.slides[currentSlideIndex] = {
      ...updated.slides[currentSlideIndex],
      background: {
        type: gradient.includes("gradient") ? "gradient" : "solid",
        color: gradient.includes("gradient") ? "#ffffff" : gradient,
        gradient: gradient.includes("gradient") ? gradient : undefined
      }
    };
    setLocalPresentation(updated);
  };

  // simple execCommand wrapper for rich text formatting
  const execFormat = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  React.useEffect(() => {
    try {
      document.execCommand('styleWithCSS', false, true);
    } catch (e) {
      // some browsers may ignore this
    }
  }, []);

  const focusEditable = () => {
    const el = document.getElementById(`editable-${currentSlideIndex}`);
    if (el) {
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  const syncContentToState = () => {
    const el = document.getElementById(`editable-${currentSlideIndex}`);
    if (!el) return;
    const updated = { ...localPresentation };
    updated.slides[currentSlideIndex] = {
      ...updated.slides[currentSlideIndex],
      htmlContent: el.innerHTML
    };
    setLocalPresentation(updated);
  };

  const savePresentation = async () => {
    if (!localPresentation?._id) {
      toast.error('Presentation ID missing');
      return;
    }
    try {
      toast.info('Saving presentation...');
      const res = await fetch(`/api/presentations/${localPresentation._id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: localPresentation.slides, title: localPresentation.title, description: localPresentation.description })
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success('Presentation saved');
      // Notify library to refresh
      window.dispatchEvent(new Event('usageUpdated'));
    } catch (err) {
      console.error(err);
      toast.error('Failed to save presentation');
    }
  };

  // Basic drag support for elements with class 'draggable'
  // Also handles: right-click context menu, element selection highlighting
  React.useEffect(() => {
    const onMouseDown = (e) => {
      // Hide context menu on any click
      setContextMenu(null);

      const target = e.target.closest && e.target.closest('.draggable');
      if (!target) {
        // Deselect
        if (selectedElRef.current) {
          selectedElRef.current.style.outline = '';
          selectedElRef.current = null;
        }
        return;
      }

      // Select the element (highlight)
      if (selectedElRef.current && selectedElRef.current !== target) {
        selectedElRef.current.style.outline = '';
      }
      selectedElRef.current = target;
      target.style.outline = '2px solid #6366f1';
      target.style.outlineOffset = '2px';

      if (!allowDrag) return;
      e.preventDefault();
      dragState.current = {
        el: target,
        startX: e.clientX,
        startY: e.clientY,
        origX: parseFloat(target.dataset.x || 0),
        origY: parseFloat(target.dataset.y || 0)
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e) => {
      if (!dragState.current) return;
      const { el, startX, startY, origX, origY } = dragState.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const nx = origX + dx;
      const ny = origY + dy;
      el.style.transform = `translate(${nx}px, ${ny}px)`;
      el.dataset.x = nx;
      el.dataset.y = ny;
    };

    const onMouseUp = () => {
      if (!dragState.current) return;
      // persist into slide html
      setTimeout(syncContentToState, 50);
      dragState.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    // Right-click context menu on draggable elements
    const onContextMenu = (e) => {
      const target = e.target.closest && e.target.closest('.draggable');
      if (!target) return;
      e.preventDefault();
      // Select it
      if (selectedElRef.current && selectedElRef.current !== target) {
        selectedElRef.current.style.outline = '';
      }
      selectedElRef.current = target;
      target.style.outline = '2px solid #6366f1';
      target.style.outlineOffset = '2px';
      setContextMenu({ x: e.clientX, y: e.clientY, el: target });
    };

    const container = containerRef.current;
    container?.addEventListener('mousedown', onMouseDown);
    container?.addEventListener('contextmenu', onContextMenu);
    return () => {
      container?.removeEventListener('mousedown', onMouseDown);
      container?.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [currentSlideIndex, localPresentation, allowDrag]);

  // Keyboard shortcuts: Delete/Backspace to remove selected element
  React.useEffect(() => {
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      // Don't delete if typing in an input or contenteditable
      if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElRef.current) {
        e.preventDefault();
        deleteSelectedElement();
      }
      // Ctrl+D to duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedElRef.current) {
        e.preventDefault();
        duplicateSelectedElement();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [currentSlideIndex, localPresentation]);

  // Context menu actions
  const deleteSelectedElement = () => {
    const el = contextMenu?.el || selectedElRef.current;
    if (!el) return;
    el.style.outline = '';
    el.remove();
    selectedElRef.current = null;
    setTimeout(syncContentToState, 50);
    setContextMenu(null);
    toast.success('Element deleted');
  };

  const duplicateSelectedElement = () => {
    const el = contextMenu?.el || selectedElRef.current;
    if (!el) return;
    const clone = el.cloneNode(true);
    const nx = (parseFloat(el.dataset.x || 0) + 20);
    const ny = (parseFloat(el.dataset.y || 0) + 20);
    clone.dataset.x = nx;
    clone.dataset.y = ny;
    clone.style.transform = `translate(${nx}px, ${ny}px)`;
    clone.style.outline = '2px solid #6366f1';
    el.parentNode?.insertBefore(clone, el.nextSibling);
    selectedElRef.current = clone;
    setTimeout(syncContentToState, 50);
    setContextMenu(null);
  };

  const bringToFront = () => {
    const el = contextMenu?.el || selectedElRef.current;
    if (!el) return;
    el.style.zIndex = '999';
    setTimeout(syncContentToState, 50);
    setContextMenu(null);
  };

  const sendToBack = () => {
    const el = contextMenu?.el || selectedElRef.current;
    if (!el) return;
    el.style.zIndex = '0';
    setTimeout(syncContentToState, 50);
    setContextMenu(null);
  };

  const editSelectedElement = () => {
    const el = contextMenu?.el || selectedElRef.current;
    if (!el) return;
    el.contentEditable = 'true';
    el.focus();
    setContextMenu(null);
  };

  const changeElementColor = (color) => {
    const el = contextMenu?.el || selectedElRef.current;
    if (!el) return;
    const type = el.dataset.type || (el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'P' || el.tagName === 'LI' ? 'text' : '');

    if (type === 'text') {
      el.style.color = color;
    } else {
      el.style.background = color;
      el.style.fill = color;
      // Also update SVG stroke if present
      const svg = el.querySelector('svg');
      if (svg) svg.style.stroke = color;
    }
    setTimeout(syncContentToState, 50);
    setContextMenu(null);
  };

  // Text selection toolbar
  React.useEffect(() => {
    const handleUserSelect = () => {
      const selection = window.getSelection();
      if (selection.toString().length > 0 && editableRef.current?.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setTextToolbarPos({
          top: rect.top - 60,
          left: rect.left + rect.width / 2 - 250
        });
        setShowTextToolbar(true);
        setIsTextSelected(true);

        // Detect current font
        const fontFamily = window.getComputedStyle(selection.anchorNode.parentElement).fontFamily;
        setSelectedFont(fontFamily.split(',')[0].replace(/['"]/g, ''));

        // Detect current font size
        const fontSize = window.getComputedStyle(selection.anchorNode.parentElement).fontSize;
        setSelectedFontSize(fontSize.replace('px', ''));
      }
    };

    const handleMouseDown = () => {
      setShowTextToolbar(false);
      setIsTextSelected(false);
    };

    document.addEventListener('mouseup', handleUserSelect);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleUserSelect);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isFullscreen]);

  const insertTextbox = () => {
    setActiveTool({ type: 'text' });
    closeAllMenus();
    toast.info('Draw text area on the slide');
  };

  const insertShape = () => {
    focusEditable();
    const html = '<div class="draggable" data-x="0" data-y="0" contenteditable="false" style="width:160px;height:80px;background:#f3f4f6;border-radius:6px;display:inline-block;margin:6px;position:relative;cursor:grab;"></div>';
    execFormat('insertHTML', html);
    setTimeout(syncContentToState, 120);
    closeAllMenus();
  };

  const insertImage = () => {
    const url = window.prompt('Image URL (https://...)');
    if (!url) return;
    focusEditable();
    try {
      execFormat('insertImage', url);
    } catch (e) {
      execFormat('insertHTML', `<img class="draggable" data-x="0" data-y="0" src="${url}" style="max-width:100%;height:auto;display:block;position:relative;cursor:grab;"/>`);
    }
    setTimeout(syncContentToState, 200);
    closeAllMenus();
  };

  const insertTable = (rowsArg, colsArg) => {
    const rows = rowsArg || parseInt(window.prompt('Rows', '2') || '2', 10) || 2;
    const cols = colsArg || parseInt(window.prompt('Cols', '2') || '2', 10) || 2;
    let table = '<table style="border-collapse:collapse;width:100%;">';
    for (let r = 0; r < rows; r++) {
      table += '<tr>';
      for (let c = 0; c < cols; c++) {
        table += '<td style="border:1px solid #ddd;padding:8px;">Cell</td>';
      }
      table += '</tr>';
    }
    table += '</table>';
    focusEditable();
    execFormat('insertHTML', `<div class="draggable" data-x="0" data-y="0" contenteditable="false" style="display:inline-block; position:relative; cursor:grab;">${table}</div>`);
    setTimeout(syncContentToState, 200);
    closeAllMenus();
  };

  const cycleZoom = () => {
    const presets = [0.5, 0.75, 1, 1.25, 1.5, 1.75];
    const idx = presets.indexOf(zoom);
    const next = presets[(idx + 1) % presets.length];
    setZoom(next);
  };

  const renderSlideContent = () => {
    const slide = localPresentation.slides[currentSlideIndex];
    // We expect slide.htmlContent to be a string of HTML
    const html = slide.htmlContent || `<div style="padding: 40px; text-align:center;"><h1>${slide.title || 'Slide'}</h1></div>`;

    const handleSlideEdit = (e) => {
      if (isFullscreen) return;
      const updated = { ...localPresentation };
      updated.slides[currentSlideIndex].htmlContent = e.target.innerHTML;
      setLocalPresentation(updated);
    };

    return (
      <div
        className={`w-full h-full relative overflow-hidden transition-all duration-500 ease-in-out bg-white ${activeTool ? 'cursor-crosshair' : ''}`}
        id={`slide-content-${currentSlideIndex}`}
        onMouseDown={handleSlideMouseDown}
        onMouseMove={handleSlideMouseMove}
        onMouseUp={handleSlideMouseUp}
      >
        <div
          id={`editable-${currentSlideIndex}`}
          ref={editableRef}
          className="w-full h-full absolute inset-0 presentation-html-content outline-none"
          contentEditable={!isFullscreen}
          suppressContentEditableWarning={true}
          dangerouslySetInnerHTML={{ __html: html }}
          onBlur={handleSlideEdit}
        />

        {isDrawing && (
          <div
            className="absolute border-2 border-dashed border-indigo-600 bg-indigo-50/20 z-[100] pointer-events-none"
            style={{
              left: drawRect.x,
              top: drawRect.y,
              width: drawRect.w,
              height: drawRect.h
            }}
          />
        )}

        {/* Subtly show notes on bottom right if not fullscreen */}
        {!isFullscreen && slide.notes && (
          <div className="absolute bottom-4 right-6 text-white/50 text-sm max-w-sm text-right opacity-0 hover:opacity-100 transition-opacity z-50 mix-blend-difference">
            {slide.notes}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden" ref={containerRef}>
      {/* Header controls (hide in fullscreen) */}
      {/* header/navigation bar – stripped down for a cleaner appearance */}
      {!isFullscreen && (
        <div className="flex items-center justify-center p-2 border-b border-gray-100 bg-[#f9fafb] flex-shrink-0">
          <div className="flex justify-center relative" ref={toolbarRef}>
            <div className="flex items-center justify-center bg-[#fcfcfc] shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-gray-200 rounded-[16px] px-1.5 py-1.5 gap-1 select-none">

              <div className="relative" data-menu-trigger>
                <div onClick={togglePointerMenu} className={`flex items-center gap-0.5 rounded-[12px] px-3 py-1.5 cursor-pointer transition-colors ${showPointerMenu ? 'bg-[#1a1a1a] text-white' : !allowDrag ? 'bg-[#1a1a1a] text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                  {!allowDrag ? <MousePointer2 className="w-4 h-4 fill-current" /> : <Hand className="w-4 h-4" />}
                  <ChevronDown className="w-3 h-3 opacity-70 ml-1" />
                </div>
                {showPointerMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 text-[13px] w-32 z-50 menu-dropdown">
                    <button onClick={() => { setAllowDrag(false); closeAllMenus(); }} className={`flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 ${!allowDrag ? 'bg-gray-100' : ''}`}>
                      <MousePointer2 className="w-4 h-4" /> Move
                    </button>
                    <button onClick={() => { setAllowDrag(true); closeAllMenus(); }} className={`flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 ${allowDrag ? 'bg-gray-100' : ''}`}>
                      <Hand className="w-4 h-4" /> Drag
                    </button>
                  </div>
                )}
              </div>

              <button onClick={() => { closeAllMenus(); insertTextbox(); }} className={`p-2 rounded-[12px] transition-colors ${showTextToolbar ? 'bg-[#1a1a1a] text-white' : 'hover:bg-gray-100 text-gray-600'}`} title="Text">
                <Type className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-gray-300 mx-1"></div>

              <div className="relative" data-menu-trigger>
                <button onClick={toggleLayoutPicker} className={`p-2 rounded-[12px] transition-colors ${showLayoutPicker ? 'bg-[#1a1a1a] text-white' : 'hover:bg-gray-100 text-gray-600'}`} title="Layouts">
                  <LayoutTemplate className="w-4 h-4" />
                </button>
                {showLayoutPicker && (
                  <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100 p-3 w-[420px] z-50 menu-dropdown">
                    <div className="text-[13px] text-black font-medium mb-3 px-1">Select layout</div>
                    <div className="grid grid-cols-4 gap-x-2 gap-y-3">

                      {/* 1: Title Top */}
                      <button onClick={() => applyLayout('title-top')} className="group flex flex-col items-center gap-1.5 focus:outline-none">
                        <div className="w-[88px] h-[58px] bg-[#eef2ff] border-2 border-transparent group-hover:border-blue-500 rounded flex flex-col p-1.5 overflow-hidden transition-all">
                          <div className="w-full h-1.5 bg-[#8fb6f9] rounded-sm mb-1"></div>
                          <div className="w-2/3 h-1 bg-[#8fb6f9] rounded-sm mb-1.5 opacity-60"></div>
                          <div className="flex-1 bg-white rounded flex items-center justify-center relative">
                            <div className="w-2.5 h-2.5 bg-[#609afb] rounded-sm absolute bottom-1 right-2"></div>
                            <div className="w-3 h-3 border border-[#609afb] rounded-full absolute bottom-1 right-5"></div>
                            <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[8px] border-l-transparent border-r-transparent border-b-[#609afb] absolute bottom-2 right-3.5"></div>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-700 text-center leading-tight">Title Top</span>
                      </button>

                      {/* 2: Title Left */}
                      <button onClick={() => applyLayout('title-left')} className="group flex flex-col items-center gap-1.5 focus:outline-none">
                        <div className="w-[88px] h-[58px] bg-[#eef2ff] border-2 border-transparent group-hover:border-blue-500 rounded flex p-1.5 gap-1.5 overflow-hidden transition-all">
                          <div className="w-1/3 h-full flex flex-col justify-center">
                            <div className="w-full h-1.5 bg-[#8fb6f9] rounded-sm mb-1"></div>
                            <div className="w-full h-1 bg-[#8fb6f9] rounded-sm opacity-60"></div>
                          </div>
                          <div className="flex-1 bg-white rounded flex items-center justify-center relative">
                            <div className="w-2h-2 bg-[#609afb] rounded-sm absolute bottom-2 right-2"></div>
                            <div className="w-2.5 h-2.5 border border-[#609afb] rounded-full absolute bottom-2 right-5"></div>
                            <div className="w-0 h-0 border-l-[3.5px] border-r-[3.5px] border-b-[7px] border-l-transparent border-r-transparent border-b-[#609afb] absolute bottom-3 right-3.5"></div>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-700 text-center leading-tight">Title Left</span>
                      </button>

                      {/* 3: Title Right */}
                      <button onClick={() => applyLayout('title-right')} className="group flex flex-col items-center gap-1.5 focus:outline-none">
                        <div className="w-[88px] h-[58px] bg-[#eef2ff] border-2 border-transparent group-hover:border-blue-500 rounded flex p-1.5 gap-1.5 overflow-hidden transition-all">
                          <div className="flex-1 bg-white rounded flex items-center justify-center relative">
                            <div className="w-2h-2 bg-[#609afb] rounded-sm absolute bottom-2 right-2"></div>
                            <div className="w-2.5 h-2.5 border border-[#609afb] rounded-full absolute bottom-2 right-5"></div>
                            <div className="w-0 h-0 border-l-[3.5px] border-r-[3.5px] border-b-[7px] border-l-transparent border-r-transparent border-b-[#609afb] absolute bottom-3 right-3.5"></div>
                          </div>
                          <div className="w-1/3 h-full flex flex-col justify-center">
                            <div className="w-full h-1.5 bg-[#8fb6f9] rounded-sm mb-1"></div>
                            <div className="w-full h-1 bg-[#8fb6f9] rounded-sm opacity-60"></div>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-700 text-center leading-tight">Title Right</span>
                      </button>

                      {/* 4: Left Image - Title Top */}
                      <button onClick={() => applyLayout('left-image-title-top')} className="group flex flex-col items-center gap-1.5 focus:outline-none">
                        <div className="w-[88px] h-[58px] bg-[#eef2ff] border-2 border-transparent group-hover:border-blue-500 rounded flex flex-col p-1.5 overflow-hidden transition-all">
                          <div className="w-full h-1.5 bg-[#8fb6f9] rounded-sm mb-1"></div>
                          <div className="flex flex-1 gap-1.5">
                            <div className="flex-1 bg-white rounded flex items-center justify-center relative">
                              <ImageIcon className="w-3 h-3 text-[#609afb]" strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 bg-white rounded flex items-center justify-center relative">
                              <div className="w-2h-2 bg-[#609afb] rounded-sm absolute bottom-1 right-1"></div>
                              <div className="w-2 h-2 border border-[#609afb] rounded-full absolute bottom-1 right-3.5"></div>
                              <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[6px] border-l-transparent border-r-transparent border-b-[#609afb] absolute bottom-2 right-2.5"></div>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-700 text-center leading-tight">Left Image - Title Top</span>
                      </button>

                      {/* 5: Right Image - Title Top */}
                      <button onClick={() => applyLayout('right-image-title-top')} className="group flex flex-col items-center gap-1.5 focus:outline-none">
                        <div className="w-[88px] h-[58px] bg-[#eef2ff] border-2 border-transparent group-hover:border-blue-500 rounded flex flex-col p-1.5 overflow-hidden transition-all">
                          <div className="w-full h-1.5 bg-[#8fb6f9] rounded-sm mb-1"></div>
                          <div className="flex flex-1 gap-1.5">
                            <div className="flex-1 bg-white rounded flex items-center justify-center relative">
                              <div className="w-2h-2 bg-[#609afb] rounded-sm absolute bottom-1 right-1"></div>
                              <div className="w-2 h-2 border border-[#609afb] rounded-full absolute bottom-1 right-3.5"></div>
                              <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[6px] border-l-transparent border-r-transparent border-b-[#609afb] absolute bottom-2 right-2.5"></div>
                            </div>
                            <div className="flex-1 bg-white rounded flex items-center justify-center relative">
                              <ImageIcon className="w-3 h-3 text-[#609afb]" strokeWidth={2.5} />
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-700 text-center leading-tight">Right Image - Title Top</span>
                      </button>

                      {/* 6: Left Image */}
                      <button onClick={() => applyLayout('left-image')} className="group flex flex-col items-center gap-1.5 focus:outline-none">
                        <div className="w-[88px] h-[58px] bg-[#eef2ff] border-2 border-transparent group-hover:border-blue-500 rounded flex p-1.5 gap-1.5 overflow-hidden transition-all">
                          <div className="w-1/2 bg-white rounded flex items-center justify-center relative">
                            <ImageIcon className="w-4 h-4 text-[#609afb]" strokeWidth={2.5} />
                          </div>
                          <div className="w-1/2 bg-white rounded flex items-center justify-center relative">
                            <div className="w-2h-2 bg-[#609afb] rounded-sm absolute bottom-1 right-1"></div>
                            <div className="w-2 h-2 border border-[#609afb] rounded-full absolute bottom-1 right-4"></div>
                            <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[6px] border-l-transparent border-r-transparent border-b-[#609afb] absolute bottom-2.5 right-2.5"></div>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-700 text-center leading-tight">Left Image</span>
                      </button>

                      {/* 7: Right Image */}
                      <button onClick={() => applyLayout('right-image')} className="group flex flex-col items-center gap-1.5 focus:outline-none">
                        <div className="w-[88px] h-[58px] bg-[#eef2ff] border-2 border-transparent group-hover:border-blue-500 rounded flex p-1.5 gap-1.5 overflow-hidden transition-all">
                          <div className="w-1/2 bg-white rounded flex justify-center relative">
                            <div className="w-1/2 h-1 bg-[#8fb6f9] rounded-sm mt-1.5 opacity-60"></div>
                            <div className="w-2h-2 bg-[#609afb] rounded-sm absolute bottom-1 right-1"></div>
                            <div className="w-2 h-2 border border-[#609afb] rounded-full absolute bottom-1 right-4"></div>
                            <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[6px] border-l-transparent border-r-transparent border-b-[#609afb] absolute bottom-2.5 right-2.5"></div>
                          </div>
                          <div className="w-1/2 bg-white rounded flex items-center justify-center relative">
                            <ImageIcon className="w-4 h-4 text-[#609afb]" strokeWidth={2.5} />
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-700 text-center leading-tight">Right Image</span>
                      </button>

                      {/* 8: Full Background Image */}
                      <button onClick={() => applyLayout('full-background')} className="group flex flex-col items-center gap-1.5 focus:outline-none">
                        <div className="w-[88px] h-[58px] bg-[#eef2ff] border-2 border-transparent group-hover:border-blue-500 rounded flex items-center justify-center overflow-hidden transition-all">
                          <ImageIcon className="w-5 h-5 text-[#609afb] opacity-80" strokeWidth={2.5} />
                        </div>
                        <span className="text-[10px] text-gray-700 text-center leading-tight">Full Background<br />Image</span>
                      </button>

                      {/* 9: Three Cols */}
                      <button onClick={() => applyLayout('three-cols')} className="group flex flex-col items-center gap-1.5 focus:outline-none">
                        <div className="w-[88px] h-[58px] bg-[#eef2ff] border-2 border-transparent group-hover:border-blue-500 rounded flex flex-col p-1.5 overflow-hidden transition-all">
                          <div className="w-full h-1 bg-[#8fb6f9] rounded-sm mb-1 opacity-60"></div>
                          <div className="flex flex-1 gap-1">
                            <div className="flex-1 bg-white rounded"></div>
                            <div className="flex-1 bg-white rounded"></div>
                            <div className="flex-1 bg-white rounded"></div>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-700 text-center leading-tight">3 Columns</span>
                      </button>

                      {/* 10: Four Grid */}
                      <button onClick={() => applyLayout('four-grid')} className="group flex flex-col items-center gap-1.5 focus:outline-none">
                        <div className="w-[88px] h-[58px] bg-[#eef2ff] border-2 border-transparent group-hover:border-blue-500 rounded flex flex-col p-1.5 gap-1 overflow-hidden transition-all">
                          <div className="flex flex-1 gap-1">
                            <div className="flex-1 bg-white rounded flex items-center justify-center relative"></div>
                            <div className="flex-1 bg-white rounded flex items-center justify-center relative"></div>
                          </div>
                          <div className="flex flex-1 gap-1">
                            <div className="flex-1 bg-white rounded flex items-center justify-center relative"></div>
                            <div className="flex-1 bg-white rounded flex items-center justify-center relative"></div>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-700 text-center leading-tight">Grid 2x2</span>
                      </button>

                      {/* 11: Top Banner Image */}
                      <button onClick={() => applyLayout('top-banner')} className="group flex flex-col items-center gap-1.5 focus:outline-none">
                        <div className="w-[88px] h-[58px] bg-[#eef2ff] border-2 border-transparent group-hover:border-blue-500 rounded flex flex-col p-1.5 gap-1 overflow-hidden transition-all">
                          <div className="w-full h-2/5 bg-blue-100/50 rounded flex justify-center items-center"><ImageIcon className="w-2.5 h-2.5 text-[#609afb]" /></div>
                          <div className="w-full flex-1 bg-white rounded p-1 flex flex-col">
                            <div className="w-1/2 h-0.5 bg-[#8fb6f9] rounded-sm mb-1 opacity-60"></div>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-700 text-center leading-tight">Top Banner</span>
                      </button>

                      {/* 12: Split Horiz */}
                      <button onClick={() => applyLayout('split-horiz')} className="group flex flex-col items-center gap-1.5 focus:outline-none">
                        <div className="w-[88px] h-[58px] bg-[#eef2ff] border-2 border-transparent group-hover:border-blue-500 rounded flex flex-col p-1.5 gap-1.5 overflow-hidden transition-all">
                          <div className="w-full flex-1 bg-white rounded flex justify-center items-center">
                            <div className="w-1/3 h-1 bg-[#8fb6f9] rounded-sm opacity-60"></div>
                          </div>
                          <div className="w-full flex-1 bg-white rounded p-1 flex "></div>
                        </div>
                        <span className="text-[10px] text-gray-700 text-center leading-tight">Split Horiz</span>
                      </button>

                      {/* 13: Caption Bottom */}
                      <button onClick={() => applyLayout('caption-bottom')} className="group flex flex-col items-center gap-1.5 focus:outline-none">
                        <div className="w-[88px] h-[58px] bg-[#eef2ff] border-2 border-transparent group-hover:border-blue-500 rounded flex flex-col p-1.5 overflow-hidden transition-all">
                          <div className="w-full flex-1 bg-white rounded mb-1 flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-[#609afb]" strokeWidth={2.5} />
                          </div>
                          <div className="w-2/3 h-1 bg-[#8fb6f9] rounded-sm opacity-60 mx-auto"></div>
                        </div>
                        <span className="text-[10px] text-gray-700 text-center leading-tight">Caption Bottom</span>
                      </button>

                      {/* 14: Dual List */}
                      <button onClick={() => applyLayout('dual-list')} className="group flex flex-col items-center gap-1.5 focus:outline-none">
                        <div className="w-[88px] h-[58px] bg-[#eef2ff] border-2 border-transparent group-hover:border-blue-500 rounded flex flex-col p-1.5 overflow-hidden transition-all">
                          <div className="w-full h-1.5 bg-[#8fb6f9] rounded-sm mb-1"></div>
                          <div className="flex flex-1 gap-1.5">
                            <div className="flex-1 bg-white rounded p-1 flex flex-col gap-0.5">
                              <div className="w-full h-0.5 bg-[#8fb6f9] opacity-40 rounded"></div>
                              <div className="w-full h-0.5 bg-[#8fb6f9] opacity-40 rounded"></div>
                              <div className="w-full h-0.5 bg-[#8fb6f9] opacity-40 rounded"></div>
                            </div>
                            <div className="flex-1 bg-white rounded p-1 flex flex-col gap-0.5">
                              <div className="w-full h-0.5 bg-[#8fb6f9] opacity-40 rounded"></div>
                              <div className="w-full h-0.5 bg-[#8fb6f9] opacity-40 rounded"></div>
                              <div className="w-full h-0.5 bg-[#8fb6f9] opacity-40 rounded"></div>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-700 text-center leading-tight">Dual List</span>
                      </button>

                      {/* 15: Centered Quote */}
                      <button onClick={() => applyLayout('centered-quote')} className="group flex flex-col items-center gap-1.5 focus:outline-none">
                        <div className="w-[88px] h-[58px] bg-[#eef2ff] border-2 border-transparent group-hover:border-blue-500 rounded flex flex-col p-1.5 overflow-hidden transition-all items-center justify-center relative">
                          <div className="text-[#609afb] text-[20px] font-serif leading-none absolute top-1 left-2">"</div>
                          <div className="w-2/3 h-1.5 bg-[#8fb6f9] rounded-sm mb-1 mt-1 opacity-80"></div>
                          <div className="w-1/2 h-1.5 bg-[#8fb6f9] rounded-sm mb-1 opacity-80"></div>
                          <div className="w-1/3 h-0.5 bg-[#8fb6f9] rounded-sm opacity-40 mt-1"></div>
                        </div>
                        <span className="text-[10px] text-gray-700 text-center leading-tight">Centered Quote</span>
                      </button>

                      {/* 16: Blank */}
                      <button onClick={() => applyLayout('blank')} className="group flex flex-col items-center gap-1.5 focus:outline-none">
                        <div className="w-[88px] h-[58px] bg-white border-2 border-gray-200 group-hover:border-blue-500 rounded transition-all"></div>
                        <span className="text-[10px] text-gray-700 text-center leading-tight">Blank</span>
                      </button>

                    </div>
                  </div>
                )}
              </div>

              <div className="relative" data-menu-trigger>
                <button onClick={toggleShapesMenu} className={`p-2 rounded-[12px] transition-colors ${showShapes ? 'bg-[#1a1a1a] text-white' : 'hover:bg-gray-100 text-gray-600'}`} title="Shapes">
                  <Shapes className="w-4 h-4" />
                </button>
                {showShapes && (
                  <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-xl border border-gray-100 p-3 w-[380px] z-50 menu-dropdown max-h-[480px] overflow-y-auto">
                    {Object.entries(SHAPE_CATALOG).map(([category, shapes]) => (
                      <div key={category} className="mb-3">
                        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider px-1 mb-2">{category}</div>
                        <div className="grid grid-cols-10 gap-1">
                          {shapes.map(shape => (
                            <button
                              key={shape.id}
                              title={shape.label}
                              onClick={() => insertShapeType(shape.id)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-gray-900"
                            >
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" dangerouslySetInnerHTML={{ __html: shape.svg }} />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={() => { closeAllMenus(); insertShape(); }} className="p-2 hover:bg-gray-100 rounded-[12px] transition-colors text-gray-600" title="Quick Shape">
                <Square className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-gray-300 mx-1"></div>

              <div className="relative" data-menu-trigger>
                <button onClick={toggleConnectorsMenu} className={`p-2 rounded-[12px] transition-colors ${showConnectors ? 'bg-[#1a1a1a] text-white' : 'hover:bg-gray-100 text-gray-600'}`} title="Connectors">
                  <Spline className="w-4 h-4" />
                </button>
                {showConnectors && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-100 p-2 w-[280px] z-50 menu-dropdown">
                    <div className="bg-[#f3f4f6] px-3 py-1.5 text-xs text-gray-500 rounded font-medium mb-1">Straight Line</div>
                    <div className="flex justify-between px-3 py-2">
                      <LineIcon type={'line'} /> <LineIcon type={'arrow'} /> <LineIcon type={'dot'} /> <LineIcon type={'square'} /> <LineIcon type={'open-arrow'} />
                    </div>
                    <div className="bg-[#f3f4f6] px-3 py-1.5 text-xs text-gray-500 rounded font-medium mt-1 mb-1">Curve</div>
                    <div className="flex justify-between px-3 py-2">
                      <LineIcon type={'elbow'} /> <LineIcon type={'elbow-step'} /> <LineIcon type={'curve'} /> <LineIcon type={'curve-s'} /> <LineIcon type={'arc'} />
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => { closeAllMenus(); insertImage(); }} className="p-2 hover:bg-gray-100 rounded-[12px] transition-colors text-gray-600" title="Image">
                <ImageIcon className="w-4 h-4" />
              </button>

              <div className="relative" data-menu-trigger>
                <button onClick={toggleTablePicker} className={`p-2 rounded-[12px] transition-colors ${showTablePicker ? 'bg-[#1a1a1a] text-white' : 'hover:bg-gray-100 text-gray-600'}`} title="Table">
                  <Table className="w-4 h-4" />
                </button>
                {showTablePicker && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4 w-[260px] z-50 menu-dropdown">
                    <div className="text-[13px] text-gray-500 mb-3">Create Table</div>
                    <div className="grid grid-cols-10 gap-0.5" onMouseLeave={() => { setTableHoverR(0); setTableHoverC(0); }}>
                      {Array.from({ length: 10 }).map((_, r) => (
                        Array.from({ length: 10 }).map((__, c) => (
                          <div
                            key={`${r}-${c}`}
                            onMouseEnter={() => { setTableHoverR(r + 1); setTableHoverC(c + 1); }}
                            onClick={() => { insertTable(r + 1, c + 1); closeAllMenus(); }}
                            className={`w-[20px] h-[20px] border ${r < tableHoverR && c < tableHoverC ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200'} rounded-[2px] cursor-pointer`}
                          />
                        ))
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" data-menu-trigger>
                <button onClick={toggleEqPicker} className={`p-2 rounded-[12px] transition-colors ${showEqPicker ? 'bg-[#1a1a1a] text-white' : 'hover:bg-gray-100 text-gray-600'}`} title="Equations">
                  <span className="font-serif italic font-medium text-[1.1rem] leading-none px-0.5">fx</span>
                </button>
                {showEqPicker && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-100 w-[360px] z-50 overflow-hidden pb-3 menu-dropdown">
                    <div className="bg-[#f4f4f4] px-4 py-2.5 text-[13px] text-gray-500 font-medium">Common Equations</div>
                    <div className="w-full divide-y divide-gray-50 max-h-[380px] overflow-y-auto">
                      {commonEquations.map((eq, i) => (
                        <button
                          key={i}
                          onClick={() => insertEquationTool(eq.html)}
                          className="w-full px-5 py-3 hover:bg-blue-50 cursor-pointer text-left transition-colors"
                        >
                          <div className="text-[11px] text-gray-400 mb-1">{eq.title}</div>
                          <div
                            className="text-center font-serif text-[16px] text-black leading-loose"
                            dangerouslySetInnerHTML={{ __html: eq.html }}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="px-4 pt-3 flex justify-between items-center gap-2">
                      <button
                        onClick={() => { closeAllMenus(); setShowEqModal(true); setEqModalMode('ai'); }}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-[13px] transition-colors flex-1 justify-center"
                      >
                        ✨ Generate with AI
                      </button>
                      <button
                        onClick={() => { closeAllMenus(); setShowEqModal(true); setEqModalMode('edit'); setEqEditHtml(''); }}
                        className="flex items-center gap-2 bg-[#f4f4f4] hover:bg-[#eaeaea] text-gray-600 px-3 py-1.5 rounded-lg text-[13px] transition-colors border border-gray-200"
                      >
                        <PenLine className="w-3.5 h-3.5" /> Edit Formula
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" data-menu-trigger>
                <button onClick={toggleIconPicker} className={`p-2 rounded-[12px] transition-colors ${showIconPicker ? 'bg-[#1a1a1a] text-white' : 'hover:bg-gray-100 text-gray-600'}`} title="Icons">
                  <Boxes className="w-4 h-4" />
                </button>
                {showIconPicker && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-100 p-4 w-[280px] z-50 menu-dropdown">
                    <div className="relative mb-4">
                      <input type="text" placeholder="Search Icon" className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-gray-300 text-gray-500" />
                      <div className="w-4 h-4 bg-gray-300 text-white rounded-full flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                        <X className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-y-4 gap-x-2 justify-items-center">
                      {[Home, User, Heart, Star, Settings, Search, Mail, Phone, Calendar, Clock, MapPin, Link, Download, Upload, CornerUpRight, ThumbsUp, ThumbsDown, Eye, Lock, Unlock].map((IconComp, idx) => (
                        <button key={idx} onClick={() => { closeAllMenus(); }} className="text-gray-700 hover:text-black hover:scale-110 transition-transform">
                          <IconComp className="w-[18px] h-[18px] fill-current" strokeWidth={0} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => closeAllMenus()} className="p-2 hover:bg-gray-100 rounded-[12px] transition-colors text-gray-600" title="Media">
                <MonitorPlay className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-gray-300 mx-1"></div>

              <button onClick={() => { closeAllMenus(); setZoom(1); }} className="p-2 hover:bg-gray-100 rounded-[12px] transition-colors text-gray-600" title="Fit to screen">
                <Maximize2 className="w-4 h-4" />
              </button>

              <div className="relative" data-menu-trigger>
                <div onClick={toggleZoomMenu} className={`flex items-center gap-1 px-3 py-1.5 cursor-pointer rounded-[12px] transition-colors ${showZoomMenu ? 'bg-[#1a1a1a] text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                  <span className="text-[13px] font-medium">{Math.round(zoom * 100)}%</span>
                  <ChevronDown className="w-3 h-3 opacity-80" />
                </div>
                {showZoomMenu && (
                  <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-lg border border-gray-100 py-2 w-[140px] z-50 text-[13px] menu-dropdown">
                    <button onClick={() => { setZoom(z => z + 0.25); closeAllMenus(); }} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700">Zoom In</button>
                    <button onClick={() => { setZoom(z => Math.max(z - 0.25, 0.25)); closeAllMenus(); }} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700">Zoom Out</button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button onClick={() => { setZoom(1.0); closeAllMenus(); }} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700">100%</button>
                    <button onClick={() => { setZoom(1.5); closeAllMenus(); }} className={`block mx-2 w-[calc(100%-16px)] text-left px-2 py-1.5 rounded-md ${zoom === 1.5 ? 'bg-gray-100 text-black font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>150%</button>
                    <button onClick={() => { setZoom(2.0); closeAllMenus(); }} className={`block mx-2 w-[calc(100%-16px)] text-left px-2 py-1.5 rounded-md ${zoom === 2.0 ? 'bg-gray-100 text-black font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>200%</button>
                  </div>
                )}
              </div>

              <div className="w-px h-5 bg-gray-300 mx-1"></div>

              <button
                onClick={() => { closeAllMenus(); savePresentation(); }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-1.5 rounded-xl text-[13px] font-medium transition-colors"
                title="Save"
              >
                Save
              </button>

              <button
                onClick={() => { closeAllMenus(); setEditingSlide(!editingSlide); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-medium transition-colors ${editingSlide ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100 text-gray-700'}`}
                title="Edit Theme"
              >
                <Settings className="w-4 h-4" /> <span className="hidden lg:inline">Theme</span>
              </button>

              <button
                onClick={() => { closeAllMenus(); handleClientDownload(); }}
                disabled={isDownloadingState}
                className="flex items-center gap-1.5 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-xl disabled:opacity-50 text-[13px] font-medium transition-colors"
                title="Export PPTX"
              >
                {isDownloadingState ? <span className="animate-spin text-lg">⚙</span> : <Download className="w-4 h-4" />}
                <span className="hidden lg:inline">Export</span>
              </button>

              <button
                onClick={() => { closeAllMenus(); handleFullscreen(); }}
                className="flex items-center gap-1.5 bg-[#1a1a1a] text-white px-4 py-1.5 rounded-xl hover:bg-black/90 text-[13px] font-medium transition-colors ml-1"
                title="Play Presentation"
              >
                <Play className="w-4 h-4" fill="currentColor" /> Play
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Studio Area with Sidebar and Main Preview */}
      <div className={`flex-1 flex relative overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'bg-gray-50'}`}>
        {/* Left Sidebar with Vertical Slides Thumbnail Strip */}
        {!isFullscreen && (
          <div className="w-32 flex-shrink-0 flex flex-col gap-2 p-3 bg-white border-r border-gray-200 overflow-hidden">
            {localPresentation.slides.map((s, idx) => (
              <button
                key={idx}
                onClick={() => { closeAllMenus(); setCurrentSlideIndex(idx); }}
                className={`h-20 w-full rounded-lg overflow-hidden relative flex-shrink-0 transition-all `}
                style={{ background: "#ffffff", border: idx === currentSlideIndex ? '2px solid #3b82f6' : '1px solid #e5e7eb', opacity: idx === currentSlideIndex ? 1 : 0.6 }}
              >
                <div
                  className="w-full h-full absolute inset-0 text-[1px] leading-tight overflow-hidden text-black thumbnail-html-content"
                  style={{ pointerEvents: 'none', transform: 'scale(0.15)', transformOrigin: 'top left', width: '733%', height: '533%' }}
                  dangerouslySetInnerHTML={{ __html: s.htmlContent || `<div style="padding: 10px; text-align:center;"><h1>${s.title || 'Slide'}</h1></div>` }}
                />
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <span className="text-white text-[10px] font-bold font-mono px-1 py-0.5 rounded bg-black/60">{idx + 1}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Editor Sidebar */}
        {!isFullscreen && editingSlide && (
          <div className="w-64 bg-white rounded-xl border border-border p-4 shadow-sm flex flex-col gap-6 overflow-hidden hidden md:flex absolute top-4 right-4 bottom-4 z-40">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 text-center text-muted-foreground">
                HTML Slides are read-only in this version.
              </h3>
            </div>
          </div>
        )}

        {/* Slide Preview Container */}
        <div className={`flex-1 relative flex items-center justify-center overflow-hidden ${isFullscreen ? 'bg-black' : 'bg-transparent'}`}>

          {/* slide viewport – minimalist styling */}
          <div className={`w-full h-full relative group transition-all duration-300 ${isFullscreen ? '' : 'overflow-hidden'}`} style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlideIndex}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full flex items-center justify-center bg-white"
              >
                {renderSlideContent()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Overlay (Visible on hover or fullscreen) */}
            <div className={`absolute inset-y-0 left-0 w-1/4 flex items-center justify-start p-4 opacity-0 ${isFullscreen ? 'hover:opacity-100' : 'group-hover:opacity-100'} transition-opacity pointer-events-none z-50`}>
              <button
                onClick={() => { closeAllMenus(); handlePrev(); }}
                disabled={currentSlideIndex === 0}
                className="pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full bg-white/20 text-black hover:bg-white/30 disabled:opacity-0 transition-all"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            </div>
            <div className={`absolute inset-y-0 right-0 w-1/4 flex items-center justify-end p-4 opacity-0 ${isFullscreen ? 'hover:opacity-100' : 'group-hover:opacity-100'} transition-opacity pointer-events-none z-50`}>
              <button
                onClick={() => { closeAllMenus(); handleNext(); }}
                disabled={currentSlideIndex === localPresentation.slides.length - 1}
                className="pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full bg-white/20 text-black hover:bg-white/30 disabled:opacity-0 transition-all"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>

            {/* Fullscreen Close */}
            {isFullscreen && (
              <button
                onClick={() => { closeAllMenus(); handleFullscreen(); }}
                className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors border border-white/20 z-50"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Text Formatting Toolbar */}
          {showTextToolbar && isTextSelected && !isFullscreen && (
            <div
              className="fixed bg-white border border-gray-200 rounded-lg shadow-xl p-3 z-50 flex items-center gap-2"
              style={{
                top: `${textToolbarPos.top}px`,
                left: `${textToolbarPos.left}px`,
                width: "500px"
              }}
            >
              {/* Font Family */}
              <select
                value={selectedFont}
                onChange={(e) => {
                  execFormat('fontName', e.target.value);
                  setSelectedFont(e.target.value);
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option>Arial</option>
                <option>Verdana</option>
                <option>Helvetica</option>
                <option>Times New Roman</option>
                <option>Courier New</option>
                <option>Georgia</option>
                <option>Comic Sans MS</option>
                <option>Trebuchet MS</option>
              </select>

              {/* Font Size */}
              <select
                value={selectedFontSize}
                onChange={(e) => {
                  execFormat('fontSize', Math.max(8, Math.min(72, parseInt(e.target.value))));
                  setSelectedFontSize(e.target.value);
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-16"
              >
                {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72].map(size => (
                  <option key={size} value={size}>{size}px</option>
                ))}
              </select>

              {/* Divider */}
              <div className="w-px h-6 bg-gray-300 mx-1"></div>

              {/* Bold */}
              <button
                onClick={() => execFormat('bold')}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Bold (Ctrl+B)"
              >
                <Bold className="w-4 h-4" />
              </button>

              {/* Italic */}
              <button
                onClick={() => execFormat('italic')}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Italic (Ctrl+I)"
              >
                <Italic className="w-4 h-4" />
              </button>

              {/* Underline */}
              <button
                onClick={() => execFormat('underline')}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Underline (Ctrl+U)"
              >
                <Underline className="w-4 h-4" />
              </button>

              {/* Strikethrough */}
              <button
                onClick={() => execFormat('strikethrough')}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Strikethrough"
              >
                <span className="text-sm font-bold">S̶</span>
              </button>

              {/* Divider */}
              <div className="w-px h-6 bg-gray-300 mx-1"></div>

              {/* Align Left */}
              <button
                onClick={() => execFormat('justifyLeft')}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Align Left"
              >
                <AlignLeft className="w-4 h-4" />
              </button>

              {/* Align Center */}
              <button
                onClick={() => execFormat('justifyCenter')}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Align Center"
              >
                <AlignCenter className="w-4 h-4" />
              </button>

              {/* Align Right */}
              <button
                onClick={() => execFormat('justifyRight')}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Align Right"
              >
                <AlignRight className="w-4 h-4" />
              </button>

              {/* Align Justify */}
              <button
                onClick={() => execFormat('justifyFull')}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Justify"
              >
                <AlignJustify className="w-4 h-4" />
              </button>

              {/* Divider */}
              <div className="w-px h-6 bg-gray-300 mx-1"></div>

              {/* Text Color */}
              <input
                type="color"
                onChange={(e) => execFormat('foreColor', e.target.value)}
                title="Text Color"
                className="w-8 h-8 p-1 border border-gray-300 rounded cursor-pointer"
              />

              {/* Highlight Color */}
              <input
                type="color"
                onChange={(e) => execFormat('backColor', e.target.value)}
                title="Highlight Color"
                className="w-8 h-8 p-1 border border-gray-300 rounded cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>



      {/* Context Menu for Draggable Elements */}
      {contextMenu && (
        <div
          className="fixed z-[300] bg-white rounded-lg shadow-2xl border border-gray-100 py-1.5 min-w-[180px] overflow-hidden"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={editSelectedElement} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
            <Type className="w-4 h-4 text-gray-400" /> Edit Content
          </button>
          <button onClick={duplicateSelectedElement} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
            <Copy className="w-4 h-4 text-gray-400" /> Duplicate
          </button>

          <div className="h-px bg-gray-100 my-1 mx-2"></div>

          <button onClick={bringToFront} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
            <ArrowUp className="w-4 h-4 text-gray-400" /> Bring to Front
          </button>
          <button onClick={sendToBack} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
            <ArrowDown className="w-4 h-4 text-gray-400" /> Send to Back
          </button>

          <div className="h-px bg-gray-100 my-1 mx-2"></div>

          <div className="px-4 py-2 text-[11px] text-gray-400 uppercase font-bold tracking-wider">Quick Color</div>
          <div className="px-4 py-1.5 flex flex-wrap gap-1.5">
            {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ffffff', '#000000'].map(c => (
              <button
                key={c}
                onClick={() => changeElementColor(c)}
                className="w-5 h-5 rounded-full border border-gray-200"
                style={{ background: c }}
              />
            ))}
            <div className="relative group/color w-5 h-5">
              <input
                type="color"
                onChange={(e) => changeElementColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 text-[10px] text-white">
                +
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 my-1 mx-2"></div>

          <button onClick={deleteSelectedElement} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3">
            <Trash2 className="w-4 h-4" /> Delete Element
          </button>
        </div>
      )}

      {/* Hidden container for PPTX export rendering */}
      <div id="export-container" style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '1920px', height: '1080px', pointerEvents: 'none', overflow: 'hidden' }}>
        {localPresentation.slides.map((s, idx) => (
          <div
            key={`export-slide-${idx}`}
            id={`export-slide-${idx}`}
            className="w-full h-full absolute top-0 left-0 bg-white"
            dangerouslySetInnerHTML={{ __html: s.htmlContent || `<div style="padding: 10px; text-align:center;"><h1>${s.title || 'Slide'}</h1></div>` }}
          />
        ))}
      </div>

      {/* AI Layout Reformatting Overlay */}
      {isReformattingLayout && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-2xl px-10 py-8 flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-800 font-semibold text-lg">AI is reformatting your slide…</p>
            <p className="text-gray-500 text-sm">Mapping your content to the new layout</p>
          </div>
        </div>
      )}

      {/* AI Equation Modal */}
      {showEqModal && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center" onClick={() => setShowEqModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[540px] overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex gap-2">
                <button
                  onClick={() => setEqModalMode('common')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${eqModalMode === 'common' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  Common
                </button>
                <button
                  onClick={() => setEqModalMode('ai')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${eqModalMode === 'ai' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  ✨ AI Generate
                </button>
                <button
                  onClick={() => setEqModalMode('edit')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${eqModalMode === 'edit' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  Edit HTML
                </button>
              </div>
              <button onClick={() => setShowEqModal(false)} className="text-gray-400 hover:text-gray-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Common equations mode */}
            {eqModalMode === 'common' && (
              <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
                {commonEquations.map((eq, i) => (
                  <button
                    key={i}
                    onClick={() => insertEquation(eq.html)}
                    className="w-full px-6 py-4 hover:bg-blue-50 text-left transition-colors"
                  >
                    <div className="text-[11px] text-gray-400 mb-1">{eq.title}</div>
                    <div className="font-serif text-[18px] text-center leading-loose" dangerouslySetInnerHTML={{ __html: eq.html }} />
                  </button>
                ))}
              </div>
            )}

            {/* AI Generate mode */}
            {eqModalMode === 'ai' && (
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-4">Describe the equation or formula in plain language and AI will render it as editable HTML math.</p>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={eqAiPrompt}
                    onChange={e => setEqAiPrompt(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && generateAiEquation()}
                    placeholder="e.g. area of a triangle, Navier-Stokes, standard error..."
                    className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
                    autoFocus
                  />
                  <button
                    onClick={generateAiEquation}
                    disabled={eqAiLoading}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {eqAiLoading ? '…' : 'Generate'}
                  </button>
                </div>
                {eqEditHtml && (
                  <div>
                    <div className="text-xs text-gray-400 mb-2">Preview (editable):</div>
                    <div className="border border-gray-200 rounded-lg p-4 font-serif text-xl text-center bg-gray-50 min-h-[60px]" dangerouslySetInnerHTML={{ __html: eqEditHtml }} />
                    <div className="flex gap-2 mt-3 justify-end">
                      <button onClick={() => setEqEditHtml('')} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Clear</button>
                      <button onClick={() => insertEquation(eqEditHtml)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Insert</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Edit HTML mode */}
            {eqModalMode === 'edit' && (
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-3">Paste or write custom HTML for your equation. Use <code className="bg-gray-100 px-1 rounded">sup</code>, <code className="bg-gray-100 px-1 rounded">sub</code>, and inline styles for fractions.</p>
                <textarea
                  value={eqEditHtml}
                  onChange={e => setEqEditHtml(e.target.value)}
                  rows={5}
                  placeholder="<span style='font-style:italic;'>E = mc<sup>2</sup></span>"
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm font-mono outline-none focus:border-indigo-400 resize-none"
                />
                {eqEditHtml && (
                  <div className="mt-3 border border-dashed border-gray-200 rounded-lg p-3 font-serif text-xl text-center bg-gray-50">
                    <div dangerouslySetInnerHTML={{ __html: eqEditHtml }} />
                  </div>
                )}
                <div className="flex justify-end mt-3">
                  <button onClick={() => insertEquation(eqEditHtml)} disabled={!eqEditHtml.trim()} className="px-4 py-2 bg-indigo-600 disabled:opacity-50 text-white text-sm rounded-lg hover:bg-indigo-700">Insert Formula</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
