'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { ReactSketchCanvas } from 'react-sketch-canvas'
import type { ReactSketchCanvasRef, CanvasPath } from 'react-sketch-canvas'
import { useDataChannel } from '@livekit/components-react'
import {
  Eraser, Pen, Trash2, Undo, ImagePlus,
  MousePointer2, X, Loader2
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { api, getApiUrl } from '@/lib/api'
import Cookies from 'js-cookie'

const API_URL = getApiUrl()

const COLORS = [
  '#ffffff', '#ef4444', '#3b82f6', '#22c55e',
  '#eab308', '#f97316', '#a855f7', '#ec4899',
]

const BRUSH_SIZES = [2, 4, 8]
const ERASER_SIZES = [10, 20, 40]

interface WhiteboardImage {
  id: string
  url: string
  x: number
  y: number
  width: number
  height: number
}

type Tool = 'pen' | 'eraser' | 'select'

interface DCMessage {
  type: string
  path?: CanvasPath
  id?: string
  x?: number
  y?: number
  width?: number
  height?: number
  image?: WhiteboardImage
}

interface WhiteboardProps {
  peerUserId?: number
}

export default function Whiteboard({ peerUserId }: WhiteboardProps) {
  const { id } = useParams()
  const canvasRef = useRef<ReactSketchCanvasRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Tool state
  const [tool, setTool] = useState<Tool>('pen')
  const [strokeColor, setStrokeColor] = useState('#ffffff')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [eraserWidth, setEraserWidth] = useState(20)

  // Image state
  const [images, setImages] = useState<WhiteboardImage[]>([])
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [dragState, setDragState] = useState<{
    imageId: string
    offsetX: number
    offsetY: number
  } | null>(null)
  const [resizeState, setResizeState] = useState<{
    imageId: string
    startX: number
    startY: number
    startWidth: number
    startHeight: number
    aspectRatio: number
  } | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Sync refs — avoid stale closures in DataChannel callback
  const localPathsRef = useRef<CanvasPath[]>([])
  const imagesRef = useRef<WhiteboardImage[]>([])
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  // ── Debounced save to server ──────────────────────────────────────────
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const paths = (await canvasRef.current?.exportPaths()) || []
        await api.post(`/room/${id}/whiteboard`, {
          paths,
          images: imagesRef.current,
        })
      } catch (e) {
        console.error('Failed to save whiteboard', e)
      }
    }, 3000)
  }, [id])

  // ── Fetch full state from server ──────────────────────────────────────
  const fetchFromServer = useCallback(async () => {
    try {
      const res = await api.get(`/room/${id}/whiteboard`)
      if (res.data) {
        if (res.data.paths && canvasRef.current) {
          localPathsRef.current = res.data.paths as CanvasPath[]
          canvasRef.current.loadPaths(res.data.paths as CanvasPath[])
        }
        if (res.data.images) {
          setImages(res.data.images as WhiteboardImage[])
        }
      }
    } catch (err) {
      console.error('Failed to fetch whiteboard', err)
    }
  }, [id])

  // Keep a ref so the stable DataChannel callback can call latest version
  const fetchFromServerRef = useRef(fetchFromServer)
  useEffect(() => {
    fetchFromServerRef.current = fetchFromServer
  }, [fetchFromServer])

  // ── DataChannel: receive messages ─────────────────────────────────────
  // Using the onMessage callback guarantees every message is processed
  // (the `message` return value can coalesce rapid updates).
  const onDataChannelMessage = useCallback(
    (msg: { payload: Uint8Array }) => {
      try {
        const data = JSON.parse(
          new TextDecoder().decode(msg.payload),
        ) as DCMessage

        switch (data.type) {
          case 'stroke':
            if (data.path) {
              localPathsRef.current = [...localPathsRef.current, data.path]
              canvasRef.current?.loadPaths(localPathsRef.current)
            }
            break

          case 'sync_needed':
            fetchFromServerRef.current()
            break

          case 'clear':
            canvasRef.current?.clearCanvas()
            localPathsRef.current = []
            setImages([])
            break

          case 'image_add':
            if (data.image) {
              setImages((prev) => [...prev, data.image as WhiteboardImage])
            }
            break

          case 'image_move':
            if (data.id != null && data.x != null && data.y != null) {
              setImages((prev) =>
                prev.map((img) =>
                  img.id === data.id
                    ? { ...img, x: data.x as number, y: data.y as number }
                    : img,
                ),
              )
            }
            break

          case 'image_resize':
            if (data.id != null && data.width != null && data.height != null) {
              setImages((prev) =>
                prev.map((img) =>
                  img.id === data.id
                    ? {
                        ...img,
                        width: data.width as number,
                        height: data.height as number,
                      }
                    : img,
                ),
              )
            }
            break

          case 'image_remove':
            if (data.id) {
              setImages((prev) => prev.filter((img) => img.id !== data.id))
              setSelectedImageId((prev) =>
                prev === data.id ? null : prev,
              )
            }
            break
        }
      } catch (e) {
        console.error('Error parsing whiteboard message', e)
      }
    },
    [], // stable — all accessed state uses refs or stable setters
  )

  const { send } = useDataChannel('whiteboard', onDataChannelMessage)

  // ── Send helper ───────────────────────────────────────────────────────
  const sendMessage = useCallback(
    (data: Record<string, unknown>) => {
      try {
        const msg = JSON.stringify(data)
        send(new TextEncoder().encode(msg), { reliable: true })
      } catch (e) {
        console.error('Failed to send DataChannel message', e)
      }
    },
    [send],
  )

  // ── Initial load ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchFromServer()
  }, [fetchFromServer])

  // ── Tool switching (includes calling eraseMode on the canvas ref) ─────
  const switchTool = useCallback((newTool: Tool) => {
    setTool(newTool)
    if (newTool === 'pen') canvasRef.current?.eraseMode(false)
    else if (newTool === 'eraser') canvasRef.current?.eraseMode(true)
    if (newTool !== 'select') setSelectedImageId(null)
  }, [])

  // ── Canvas: new stroke completed ──────────────────────────────────────
  const handleStroke = useCallback(
    (path: CanvasPath) => {
      localPathsRef.current = [...localPathsRef.current, path]
      sendMessage({ type: 'stroke', path })
      debouncedSave()
    },
    [sendMessage, debouncedSave],
  )

  // ── Undo ──────────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    canvasRef.current?.undo()
    // Wait for canvas internal state to settle, then sync
    setTimeout(async () => {
      try {
        const paths = await canvasRef.current?.exportPaths()
        if (paths) {
          localPathsRef.current = paths
          await api.post(`/room/${id}/whiteboard`, {
            paths,
            images: imagesRef.current,
          })
          sendMessage({ type: 'sync_needed' })
        }
      } catch (e) {
        console.error('Failed to save after undo', e)
      }
    }, 100)
  }, [id, sendMessage])

  // ── Clear ─────────────────────────────────────────────────────────────
  const handleClear = useCallback(async () => {
    canvasRef.current?.clearCanvas()
    localPathsRef.current = []
    setImages([])
    try {
      await api.delete(`/room/${id}/whiteboard`)
      sendMessage({ type: 'clear' })
    } catch (e) {
      console.error(e)
    }
  }, [id, sendMessage])

  // ── Image upload ──────────────────────────────────────────────────────
  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return
      setIsUploading(true)

      const formData = new FormData()
      formData.append('file', file)
      if (peerUserId) {
        formData.append('shared_with_id', peerUserId.toString())
      }

      try {
        const res = await api.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        // Determine natural dimensions
        const token = Cookies.get('access_token')
        const imgEl = new window.Image()

        await new Promise<void>((resolve) => {
          imgEl.onload = () => resolve()
          imgEl.onerror = () => resolve()
          imgEl.src = `${API_URL}${res.data.url}?token=${token}`
        })

        const maxWidth = 400
        let width = imgEl.naturalWidth || 400
        let height = imgEl.naturalHeight || 300
        if (width > maxWidth) {
          height = height * (maxWidth / width)
          width = maxWidth
        }

        const newImage: WhiteboardImage = {
          id: crypto.randomUUID(),
          url: res.data.url as string,
          x: 100,
          y: 100,
          width: Math.round(width),
          height: Math.round(height),
        }

        setImages((prev) => [...prev, newImage])
        sendMessage({ type: 'image_add', image: newImage })
        debouncedSave()

        // Auto-switch to select tool so user can position the image
        switchTool('select')
        setSelectedImageId(newImage.id)
      } catch (err) {
        console.error('Failed to upload image', err)
      } finally {
        setIsUploading(false)
      }
    },
    [peerUserId, sendMessage, debouncedSave, switchTool],
  )

  // ── Image removal ─────────────────────────────────────────────────────
  const removeImage = useCallback(
    (imageId: string) => {
      setImages((prev) => prev.filter((img) => img.id !== imageId))
      setSelectedImageId(null)
      sendMessage({ type: 'image_remove', id: imageId })
      debouncedSave()
    },
    [sendMessage, debouncedSave],
  )

  // ── Image drag ────────────────────────────────────────────────────────
  const handleImagePointerDown = useCallback(
    (e: React.PointerEvent, img: WhiteboardImage) => {
      if (tool !== 'select') return
      e.preventDefault()
      e.stopPropagation()
      setSelectedImageId(img.id)
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      setDragState({
        imageId: img.id,
        offsetX: e.clientX - rect.left - img.x,
        offsetY: e.clientY - rect.top - img.y,
      })
    },
    [tool],
  )

  // ── Image resize ──────────────────────────────────────────────────────
  const startResize = useCallback(
    (e: React.PointerEvent, img: WhiteboardImage) => {
      e.preventDefault()
      e.stopPropagation()
      setResizeState({
        imageId: img.id,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: img.width,
        startHeight: img.height,
        aspectRatio: img.width / img.height,
      })
    },
    [],
  )

  // ── Container pointer handlers for drag / resize ──────────────────────
  const handleContainerPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      if (dragState) {
        const newX = e.clientX - rect.left - dragState.offsetX
        const newY = e.clientY - rect.top - dragState.offsetY
        setImages((prev) =>
          prev.map((img) =>
            img.id === dragState.imageId
              ? { ...img, x: newX, y: newY }
              : img,
          ),
        )
      } else if (resizeState) {
        const dx = e.clientX - resizeState.startX
        const newWidth = Math.max(50, resizeState.startWidth + dx)
        const newHeight = newWidth / resizeState.aspectRatio
        setImages((prev) =>
          prev.map((img) =>
            img.id === resizeState.imageId
              ? {
                  ...img,
                  width: Math.round(newWidth),
                  height: Math.round(newHeight),
                }
              : img,
          ),
        )
      }
    },
    [dragState, resizeState],
  )

  const handleContainerPointerUp = useCallback(() => {
    if (dragState) {
      const img = imagesRef.current.find((i) => i.id === dragState.imageId)
      if (img) {
        sendMessage({ type: 'image_move', id: img.id, x: img.x, y: img.y })
        debouncedSave()
      }
      setDragState(null)
    }
    if (resizeState) {
      const img = imagesRef.current.find((i) => i.id === resizeState.imageId)
      if (img) {
        sendMessage({
          type: 'image_resize',
          id: img.id,
          width: img.width,
          height: img.height,
        })
        debouncedSave()
      }
      setResizeState(null)
    }
  }, [dragState, resizeState, sendMessage, debouncedSave])

  // ── Cleanup ───────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  const token = Cookies.get('access_token')

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-700 shadow-inner flex flex-col">
      {/* ─── Toolbar ─────────────────────────────────────────────── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-2 rounded-2xl flex items-center gap-1.5 shadow-2xl z-30 select-none">
        {/* Tools */}
        <button
          onClick={() => switchTool('pen')}
          className={`p-2.5 rounded-xl transition-all cursor-pointer ${
            tool === 'pen'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Карандаш"
        >
          <Pen size={16} />
        </button>
        <button
          onClick={() => switchTool('eraser')}
          className={`p-2.5 rounded-xl transition-all cursor-pointer ${
            tool === 'eraser'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Ластик"
        >
          <Eraser size={16} />
        </button>
        <button
          onClick={() => switchTool('select')}
          className={`p-2.5 rounded-xl transition-all cursor-pointer ${
            tool === 'select'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Выбор / перемещение картинок"
        >
          <MousePointer2 size={16} />
        </button>

        <div className="w-[1px] h-6 bg-slate-700 mx-0.5" />

        {/* Color palette — pen only */}
        {tool === 'pen' && (
          <>
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setStrokeColor(color)}
                className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer hover:scale-110 ${
                  strokeColor === color
                    ? 'border-indigo-400 scale-110 shadow-lg shadow-indigo-500/30'
                    : 'border-slate-600 hover:border-slate-400'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <div className="w-[1px] h-6 bg-slate-700 mx-0.5" />
          </>
        )}

        {/* Brush size presets */}
        {tool === 'pen' &&
          BRUSH_SIZES.map((size) => (
            <button
              key={`brush-${size}`}
              onClick={() => setStrokeWidth(size)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                strokeWidth === size
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={`Толщина: ${size}px`}
            >
              <div
                className="rounded-full bg-current"
                style={{ width: size + 2, height: size + 2 }}
              />
            </button>
          ))}

        {/* Eraser size presets */}
        {tool === 'eraser' &&
          ERASER_SIZES.map((size) => (
            <button
              key={`eraser-${size}`}
              onClick={() => setEraserWidth(size)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                eraserWidth === size
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={`Размер ластика: ${size}px`}
            >
              <div
                className="rounded-full border-2 border-current"
                style={{ width: size / 2 + 4, height: size / 2 + 4 }}
              />
            </button>
          ))}

        {(tool === 'pen' || tool === 'eraser') && (
          <div className="w-[1px] h-6 bg-slate-700 mx-0.5" />
        )}

        {/* Actions */}
        <button
          onClick={handleUndo}
          className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
          title="Отменить"
        >
          <Undo size={16} />
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`p-2.5 rounded-xl transition-all cursor-pointer ${
            isUploading
              ? 'text-indigo-400 animate-pulse'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Вставить картинку"
          disabled={isUploading}
        >
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
        </button>
        <button
          onClick={handleClear}
          className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
          title="Очистить доску"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleImageUpload(e.target.files[0])
            e.target.value = ''
          }
        }}
      />

      {/* ─── Canvas area ─────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 bg-[#1e293b] min-h-0 relative overflow-hidden"
        onPointerMove={handleContainerPointerMove}
        onPointerUp={handleContainerPointerUp}
        onPointerLeave={handleContainerPointerUp}
      >
        {/* Images layer (below canvas) */}
        {images.map((img) => (
          <div
            key={img.id}
            className="absolute select-none"
            style={{
              left: img.x,
              top: img.y,
              width: img.width,
              height: img.height,
              zIndex: 5,
              cursor:
                tool === 'select'
                  ? dragState?.imageId === img.id
                    ? 'grabbing'
                    : 'grab'
                  : 'default',
              pointerEvents: tool === 'select' ? 'auto' : 'none',
            }}
            onPointerDown={(e) => handleImagePointerDown(e, img)}
          >
            <img
              src={`${API_URL}${img.url}?token=${token}`}
              alt=""
              className="w-full h-full object-contain pointer-events-none"
              draggable={false}
            />

            {/* Selection UI */}
            {tool === 'select' && selectedImageId === img.id && (
              <>
                <div className="absolute inset-0 border-2 border-dashed border-indigo-400 rounded pointer-events-none" />

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(img.id)
                  }}
                  className="absolute -top-3 -right-3 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors cursor-pointer z-10"
                >
                  <X size={12} />
                </button>

                {/* Resize handle — bottom-right (maintains aspect ratio) */}
                <div
                  onPointerDown={(e) => startResize(e, img)}
                  className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-indigo-500 border-2 border-white rounded-sm cursor-se-resize shadow-md z-10 hover:bg-indigo-400"
                />

                {/* Corner indicators */}
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-indigo-500 border border-white rounded-sm pointer-events-none" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 border border-white rounded-sm pointer-events-none" />
                <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-indigo-500 border border-white rounded-sm pointer-events-none" />
              </>
            )}
          </div>
        ))}

        {/* Canvas layer (on top of images — transparent background) */}
        <div
          className="absolute inset-0"
          style={{
            zIndex: 10,
            pointerEvents: tool === 'select' ? 'none' : 'auto',
          }}
        >
          <ReactSketchCanvas
            ref={canvasRef}
            strokeWidth={strokeWidth}
            eraserWidth={eraserWidth}
            strokeColor={strokeColor}
            canvasColor="transparent"
            className="!border-none w-full h-full"
            onStroke={handleStroke}
          />
        </div>
      </div>
    </div>
  )
}
