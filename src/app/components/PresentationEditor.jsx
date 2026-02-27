"use client";

import React, { useState, useRef } from "react";
import {
  Play, Download, ChevronLeft, ChevronRight,
  Settings, Type, Square, Circle, LayoutTemplate,
  X, Layers, Trash2, Maximize, MousePointer2, Shapes, Spline,
  Image as ImageIcon, Table, Maximize2, ChevronDown, MonitorPlay, Boxes,
  Hand, Home, User, Heart, Star, Search, Mail, Phone, Calendar, Clock, MapPin,
  Link, Upload, CornerUpRight, ThumbsUp, ThumbsDown, Eye, Lock, Unlock, XCircle, PenLine,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify
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
  const [allowDrag, setAllowDrag] = useState(true);
  const [tableHoverR, setTableHoverR] = useState(0);
  const [tableHoverC, setTableHoverC] = useState(0);

  // toolbar reference for outside clicks
  const toolbarRef = useRef(null);

  // Close all menus function
  const closeAllMenus = () => {
    setShowPointerMenu(false);
    setShowShapes(false);
    setShowConnectors(false);
    setShowTablePicker(false);
    setShowEqPicker(false);
    setShowIconPicker(false);
    setShowZoomMenu(false);
  };

  // Handle clicking outside to close menus
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
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

  const insertShapeType = (type) => {
    focusEditable();
    let html = '';
    if (type === 'rectangle') html = '<div class="draggable" data-x="0" data-y="0" contenteditable="false" style="width:180px;height:100px;background:#eef2ff;border-radius:6px;display:inline-block;margin:6px;position:relative;cursor:grab;"></div>';
    if (type === 'rounded') html = '<div class="draggable" data-x="0" data-y="0" contenteditable="false" style="width:160px;height:90px;background:#fff7ed;border-radius:18px;display:inline-block;margin:6px;position:relative;cursor:grab;"></div>';
    if (type === 'circle') html = '<div class="draggable" data-x="0" data-y="0" contenteditable="false" style="width:100px;height:100px;background:#e6fffa;border-radius:50%;display:inline-block;margin:6px;position:relative;cursor:grab;"></div>';
    execFormat('insertHTML', html);
    setTimeout(syncContentToState, 120);
    setShowShapes(false);
  };

  const insertConnectorType = (kind) => {
    focusEditable();
    let svg = '';
    if (kind === 'line') svg = '<svg width="200" height="20" class="draggable" data-x="0" data-y="0" style="display:inline-block;position:relative;cursor:grab;"><line x1="0" y1="10" x2="200" y2="10" stroke="#374151" stroke-width="2"/></svg>';
    if (kind === 'arrow') svg = '<svg width="200" height="20" class="draggable" data-x="0" data-y="0" style="display:inline-block;position:relative;cursor:grab;"><line x1="0" y1="10" x2="180" y2="10" stroke="#374151" stroke-width="2"/><polygon points="180,5 195,10 180,15" fill="#374151"/></svg>';
    if (kind === 'curve') svg = '<svg width="200" height="50" class="draggable" data-x="0" data-y="0" style="display:inline-block;position:relative;cursor:grab;"><path d="M0,40 C60,0 140,80 200,40" stroke="#374151" stroke-width="2" fill="none"/></svg>';
    execFormat('insertHTML', svg);
    setTimeout(syncContentToState, 120);
    setShowConnectors(false);
  };

  const commonEquations = [
    { title: "Newton's Second Law", html: '<div style="text-align:center;font-style:italic;">F = ma</div>' },
    { title: 'Pythagorean Theorem', html: '<div style="text-align:center;font-style:italic;">a<sup>2</sup> + b<sup>2</sup> = c<sup>2</sup></div>' },
    { title: 'Quadratic Formula', html: '<div style="text-align:center;font-style:italic;">x = (-b ± √(b<sup>2</sup>-4ac)) / (2a)</div>' },
    { title: 'Area of Circle', html: '<div style="text-align:center;font-style:italic;">A = πr<sup>2</sup></div>' }
  ];

  const insertEquation = (eq) => {
    focusEditable();
    execFormat('insertHTML', `<div class="draggable" data-x="0" data-y="0" contenteditable="false" style="display:inline-block;margin:6px;position:relative;cursor:grab;">${eq}</div>`);
    setTimeout(syncContentToState, 120);
    setShowEqPicker(false);
  };

  const iconList = ['★', '❤', '⚙', '🔍', '📷', '📊', '📌', '✅', '➕', '🔔', '📎', '🔒'];
  const insertIcon = (ic) => {
    focusEditable();
    execFormat('insertHTML', `<span class="draggable" data-x="0" data-y="0" contenteditable="false" style="display:inline-block;margin:4px;font-size:20px;position:relative;cursor:grab;">${ic}</span>`);
    setTimeout(syncContentToState, 120);
    setShowIconPicker(false);
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
  React.useEffect(() => {
    const onMouseDown = (e) => {
      const target = e.target.closest && e.target.closest('.draggable');
      if (!target) return;
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

    const container = containerRef.current;
    container?.addEventListener('mousedown', onMouseDown);
    return () => {
      container?.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [currentSlideIndex, localPresentation]);

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
    focusEditable();
    const html = '<div class="draggable" data-x="0" data-y="0" contenteditable="true" style="padding:8px; border:1px dashed #ccc; display:inline-block; min-width:120px; position:relative; cursor:grab;">Edit text</div>';
    execFormat('insertHTML', html);
    setTimeout(syncContentToState, 120);
  };

  const insertShape = () => {
    focusEditable();
    const html = '<div class="draggable" data-x="0" data-y="0" contenteditable="false" style="width:160px;height:80px;background:#f3f4f6;border-radius:6px;display:inline-block;margin:6px;position:relative;cursor:grab;"></div>';
    execFormat('insertHTML', html);
    setTimeout(syncContentToState, 120);
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
  };

  const cycleZoom = () => {
    const presets = [0.5, 0.75, 1, 1.25, 1.5, 1.75];
    const idx = presets.indexOf(zoom);
    const next = presets[(idx + 1) % presets.length];
    setZoom(next);
  };

  const renderSlideContent = () => {
    // We expect slide.htmlContent to be a string of HTML
    const html = slide.htmlContent || `<div style="padding: 40px; text-align:center;"><h1>${slide.title || 'Slide'}</h1></div>`;

    const handleSlideEdit = (e) => {
      if (isFullscreen) return; // Optional: restrict editing in fullscreen, though user asked for it, so let's allow it actually.
      const updated = { ...localPresentation };
      updated.slides[currentSlideIndex].htmlContent = e.target.innerHTML;
      setLocalPresentation(updated);
    };

    return (
      <div
        className="w-full h-full relative overflow-hidden transition-all duration-500 ease-in-out bg-white"
        id={`slide-content-${currentSlideIndex}`}
      >
        <div
          id={`editable-${currentSlideIndex}`}
          ref={editableRef}
          className="w-full h-full absolute inset-0 presentation-html-content outline-none"
          contentEditable={!isFullscreen}
          suppressContentEditableWarning={true}
          dangerouslySetInnerHTML={{ __html: html }}
          onBlur={handleSlideEdit}
          onInput={(e) => {
            // We don't save to state on every keystroke to avoid cursor jumping,
            // but we could if we carefully manage the selection range.
            // For raw contenteditable, onBlur is safer for React state.
          }}
        />
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
    <div className="space-y-4 h-full flex flex-col relative" ref={containerRef}>
      {/* Header controls (hide in fullscreen) */}
      {/* header/navigation bar – stripped down for a cleaner appearance */}
      {!isFullscreen && (
        <div className="flex items-center justify-center p-2 border-b border-gray-100 bg-[#f9fafb] flex-shrink-0">
          <div className="flex justify-center relative" ref={toolbarRef}>
            <div className="flex items-center justify-center bg-[#fcfcfc] shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-gray-200 rounded-[16px] px-1.5 py-1.5 gap-1 select-none">

              <div className="relative">
                <div onClick={() => setShowPointerMenu(s => !s)} className={`flex items-center gap-0.5 rounded-[12px] px-3 py-1.5 cursor-pointer transition-colors ${!allowDrag ? 'bg-[#1a1a1a] text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                  {!allowDrag ? <MousePointer2 className="w-4 h-4 fill-current" /> : <Hand className="w-4 h-4" />}
                  <ChevronDown className="w-3 h-3 opacity-70 ml-1" />
                </div>
                {showPointerMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 text-[13px] w-32 z-50">
                    <button onClick={() => { setAllowDrag(false); setShowPointerMenu(false); }} className={`flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 ${!allowDrag ? 'bg-gray-50' : ''}`}>
                      <MousePointer2 className="w-4 h-4" /> Move
                    </button>
                    <button onClick={() => { setAllowDrag(true); setShowPointerMenu(false); }} className={`flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 ${allowDrag ? 'bg-gray-50' : ''}`}>
                      <Hand className="w-4 h-4" /> Drag
                    </button>
                  </div>
                )}
              </div>

              <button onClick={insertTextbox} className={`p-2 rounded-[12px] transition-colors ${showTextToolbar ? 'bg-[#1a1a1a] text-white' : 'hover:bg-gray-100 text-gray-600'}`} title="Text">
                <Type className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-gray-300 mx-1"></div>

              <div className="relative">
                <button onClick={() => setShowConnectors(s => !s)} className="p-2 hover:bg-gray-100 rounded-[12px] transition-colors text-gray-600" title="Connectors">
                  <Spline className="w-4 h-4" />
                </button>
                {showConnectors && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-100 p-2 w-[280px] z-50">
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

              <button onClick={insertImage} className="p-2 hover:bg-gray-100 rounded-[12px] transition-colors text-gray-600" title="Image">
                <ImageIcon className="w-4 h-4" />
              </button>

              <div className="relative">
                <button onClick={() => setShowTablePicker(s => !s)} className="p-2 hover:bg-gray-100 rounded-[12px] transition-colors text-gray-600" title="Table">
                  <Table className="w-4 h-4" />
                </button>
                {showTablePicker && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4 w-[260px] z-50">
                    <div className="text-[13px] text-gray-500 mb-3">Create Table</div>
                    <div className="grid grid-cols-10 gap-0.5" onMouseLeave={() => { setTableHoverR(0); setTableHoverC(0); }}>
                      {Array.from({ length: 10 }).map((_, r) => (
                        Array.from({ length: 10 }).map((__, c) => (
                          <div
                            key={`${r}-${c}`}
                            onMouseEnter={() => { setTableHoverR(r + 1); setTableHoverC(c + 1); }}
                            onClick={() => { insertTable(r + 1, c + 1); setShowTablePicker(false); }}
                            className={`w-[20px] h-[20px] border ${r < tableHoverR && c < tableHoverC ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200'} rounded-[2px] cursor-pointer`}
                          />
                        ))
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button onClick={() => setShowEqPicker(s => !s)} className="p-2 hover:bg-gray-100 rounded-[12px] transition-colors text-gray-600" title="Equations">
                  <span className="font-serif italic font-medium text-[1.1rem] leading-none px-0.5">fx</span>
                </button>
                {showEqPicker && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-100 w-[340px] z-50 overflow-hidden pb-3">
                    <div className="bg-[#f4f4f4] px-4 py-2.5 text-[13px] text-gray-500">Common Equations</div>
                    <div className="w-full">
                      <div className="px-5 py-3 hover:bg-gray-50 cursor-pointer">
                        <div className="text-[12px] text-gray-400 mb-1">Newton's Second Law</div>
                        <div className="text-center font-serif text-[18px] italic text-black">F = ma</div>
                      </div>
                      <div className="px-5 py-3 hover:bg-gray-50 cursor-pointer">
                        <div className="text-[12px] text-gray-400 mb-1">Pythagorean Theorem</div>
                        <div className="text-center font-serif text-[18px] italic text-black">a² + b² = c²</div>
                      </div>
                      <div className="px-5 py-3 hover:bg-gray-50 cursor-pointer">
                        <div className="text-[12px] text-gray-400 mb-1">Quadratic Formula</div>
                        <div className="flex justify-center items-center gap-1 font-serif text-[18px] italic text-black">
                          <span>x = </span>
                          <div className="flex flex-col items-center leading-none mt-1">
                            <span>-b ± √(b² - 4ac)</span>
                            <span className="h-[1px] bg-black w-[100%] block my-1"></span>
                            <span>2a</span>
                          </div>
                        </div>
                      </div>
                      <div className="px-5 py-3 bg-[#f9f9f9] cursor-pointer">
                        <div className="text-[12px] text-gray-400 mb-1">Area of Circle</div>
                        <div className="text-center font-serif text-[18px] italic text-black">A = πr²</div>
                      </div>
                      <div className="px-5 py-3 hover:bg-gray-50 cursor-pointer border-b border-white/0">
                        <div className="text-[12px] text-gray-400 mb-1">Circumference of Circle</div>
                        <div className="text-center font-serif text-[18px] italic text-black hidden">C = 2πr</div>
                      </div>
                    </div>
                    <div className="px-4 flex justify-end">
                      <button className="flex items-center gap-2 bg-[#f4f4f4] hover:bg-[#eaeaea] text-gray-600 px-3 py-1.5 rounded-lg text-[13px] transition-colors border border-gray-200">
                        <PenLine className="w-3.5 h-3.5" /> Edit Formula
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button onClick={() => setShowIconPicker(s => !s)} className={`p-2 rounded-[12px] transition-colors ${showIconPicker ? 'bg-[#1a1a1a] text-white' : 'hover:bg-gray-100 text-gray-600'}`} title="Icons">
                  <Boxes className="w-4 h-4" />
                </button>
                {showIconPicker && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-100 p-4 w-[280px] z-50">
                    <div className="relative mb-4">
                      <input type="text" placeholder="Search Icon" className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-gray-300 text-gray-500" />
                      <div className="w-4 h-4 bg-gray-300 text-white rounded-full flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                        <X className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-y-4 gap-x-2 justify-items-center">
                      {[Home, User, Heart, Star, Settings, Search, Mail, Phone, Calendar, Clock, MapPin, Link, Download, Upload, CornerUpRight, ThumbsUp, ThumbsDown, Eye, Lock, Unlock].map((IconComp, idx) => (
                        <button key={idx} onClick={() => { setShowIconPicker(false); }} className="text-gray-700 hover:text-black hover:scale-110 transition-transform">
                          <IconComp className="w-[18px] h-[18px] fill-current" strokeWidth={0} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button className="p-2 hover:bg-gray-100 rounded-[12px] transition-colors text-gray-600" title="Media">
                <MonitorPlay className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-gray-300 mx-1"></div>

              <button onClick={() => setZoom(1)} className="p-2 hover:bg-gray-100 rounded-[12px] transition-colors text-gray-600" title="Fit to screen">
                <Maximize2 className="w-4 h-4" />
              </button>

              <div className="relative">
                <div onClick={() => setShowZoomMenu(s => !s)} className="flex items-center gap-1 px-3 py-1.5 cursor-pointer hover:bg-gray-100 rounded-[12px] transition-colors text-gray-600">
                  <span className="text-[13px] font-medium">{Math.round(zoom * 100)}%</span>
                  <ChevronDown className="w-3 h-3 opacity-80" />
                </div>
                {showZoomMenu && (
                  <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-lg border border-gray-100 py-2 w-[140px] z-50 text-[13px]">
                    <button onClick={() => { setZoom(z => z + 0.25); setShowZoomMenu(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700">Zoom In</button>
                    <button onClick={() => { setZoom(z => Math.max(z - 0.25, 0.25)); setShowZoomMenu(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700">Zoom Out</button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button onClick={() => { setZoom(1.0); setShowZoomMenu(false); }} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700">100%</button>
                    <button onClick={() => { setZoom(1.5); setShowZoomMenu(false); }} className={`block mx-2 w-[calc(100%-16px)] text-left px-2 py-1.5 rounded-md ${zoom === 1.5 ? 'bg-gray-100 text-black font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>150%</button>
                    <button onClick={() => { setZoom(2.0); setShowZoomMenu(false); }} className={`block mx-2 w-[calc(100%-16px)] text-left px-2 py-1.5 rounded-md ${zoom === 2.0 ? 'bg-gray-100 text-black font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>200%</button>
                  </div>
                )}
              </div>

              <div className="w-px h-5 bg-gray-300 mx-1"></div>

              <button
                onClick={savePresentation}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-1.5 rounded-xl text-[13px] font-medium transition-colors"
                title="Save"
              >
                Save
              </button>

              <button
                onClick={() => setEditingSlide(!editingSlide)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-medium transition-colors ${editingSlide ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100 text-gray-700'}`}
                title="Edit Theme"
              >
                <Settings className="w-4 h-4" /> <span className="hidden lg:inline">Theme</span>
              </button>

              <button
                onClick={handleClientDownload}
                disabled={isDownloadingState}
                className="flex items-center gap-1.5 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-xl disabled:opacity-50 text-[13px] font-medium transition-colors"
                title="Export PPTX"
              >
                {isDownloadingState ? <span className="animate-spin text-lg">⚙</span> : <Download className="w-4 h-4" />}
                <span className="hidden lg:inline">Export</span>
              </button>

              <button
                onClick={handleFullscreen}
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
          <div className="w-32 flex flex-col gap-2 p-3 bg-white border-r border-gray-200 overflow-y-auto">
            {localPresentation.slides.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlideIndex(idx)}
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
          <div className="w-64 bg-white rounded-xl border border-border p-4 shadow-sm flex flex-col gap-6 overflow-y-auto hidden md:flex absolute top-4 right-4 bottom-4 z-40">
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
                onClick={handlePrev}
                disabled={currentSlideIndex === 0}
                className="pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full bg-white/20 text-black hover:bg-white/30 disabled:opacity-0 transition-all"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            </div>
            <div className={`absolute inset-y-0 right-0 w-1/4 flex items-center justify-end p-4 opacity-0 ${isFullscreen ? 'hover:opacity-100' : 'group-hover:opacity-100'} transition-opacity pointer-events-none z-50`}>
              <button
                onClick={handleNext}
                disabled={currentSlideIndex === localPresentation.slides.length - 1}
                className="pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full bg-white/20 text-black hover:bg-white/30 disabled:opacity-0 transition-all"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>

            {/* Fullscreen Close */}
            {isFullscreen && (
              <button
                onClick={handleFullscreen}
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
    </div>
  );
}
