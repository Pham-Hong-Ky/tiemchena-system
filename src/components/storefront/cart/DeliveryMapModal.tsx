"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { X, Navigation, Check, AlertCircle, MapPin, Loader2, Search } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  SHOP_COORDINATES,
  calculateRoadDistanceKm,
  calculateShippingFeeByKm,
  fetchOsrmDistanceKm,
  HANOI_DISTRICTS,
} from "@/data/hanoiLocations";
import { findNearestHanoiWard } from "@/services/geocodeService";

interface DeliveryMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat?: number | null;
  initialLng?: number | null;
  onConfirmLocation: (result: {
    lat: number;
    lng: number;
    distanceKm: number;
    shippingFee: number;
    isWithinRange: boolean;
    locationName?: string;
  }) => void;
}

export function DeliveryMapModal({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  onConfirmLocation,
}: DeliveryMapModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const [currentLat, setCurrentLat] = useState<number>(
    initialLat || SHOP_COORDINATES.lat + 0.005
  );
  const [currentLng, setCurrentLng] = useState<number>(
    initialLng || SHOP_COORDINATES.lng + 0.005
  );
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);

  // Thanh tìm kiếm địa chỉ / địa điểm
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ name: string; details: string; lat: number; lng: number }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Khoảng cách OSRM thực tế (async, chạy nền sau khi kéo ghim)
  const [osrmKm, setOsrmKm] = useState<number | null>(null);
  const [isFetchingOsrm, setIsFetchingOsrm] = useState<boolean>(false);

  // Haversine × 1.4 để hiển thị ngay (preview nhanh)
  const haversineKm = calculateRoadDistanceKm(currentLat, currentLng);
  // Dùng OSRM nếu có, fallback Haversine
  const distanceKm = osrmKm ?? haversineKm;
  const feeInfo = calculateShippingFeeByKm(distanceKm);

  // Gọi OSRM mỗi khi pin di chuyển (debounce 800ms)
  const osrmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchOsrm = useCallback((lat: number, lng: number) => {
    if (osrmTimerRef.current) clearTimeout(osrmTimerRef.current);
    osrmTimerRef.current = setTimeout(async () => {
      setIsFetchingOsrm(true);
      const km = await fetchOsrmDistanceKm(lat, lng);
      setOsrmKm(km);
      setIsFetchingOsrm(false);
    }, 800);
  }, []);

  // Reset OSRM khi pin thay đổi
  const updatePin = useCallback(
    (lat: number, lng: number) => {
      setCurrentLat(lat);
      setCurrentLng(lng);
      setOsrmKm(null); // reset về Haversine preview ngay
      fetchOsrm(lat, lng);
    },
    [fetchOsrm]
  );

  // Xử lý tìm kiếm địa chỉ (Local danh bạ Hà Nội + Photon OpenStreetMap)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!q.trim() || q.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results: Array<{ name: string; details: string; lat: number; lng: number }> = [];
      const cleanQ = q.toLowerCase().trim();

      // 1. Tìm nhanh trong danh sách phường/xã/quận Hà Nội
      for (const dist of HANOI_DISTRICTS) {
        if (dist.name.toLowerCase().includes(cleanQ)) {
          results.push({
            name: dist.name,
            details: "Khu vực Hà Nội",
            lat: dist.lat,
            lng: dist.lng,
          });
        }
        for (const ward of dist.wards) {
          if (ward.name.toLowerCase().includes(cleanQ)) {
            results.push({
              name: ward.name,
              details: dist.name,
              lat: ward.lat,
              lng: ward.lng,
            });
          }
        }
      }

      // 2. Tìm kiếm địa chỉ cụ thể / tòa nhà qua Photon OpenStreetMap
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
          q + " Hà Nội"
        )}&lat=${SHOP_COORDINATES.lat}&lon=${SHOP_COORDINATES.lng}&limit=6`;
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          if (data.features) {
            for (const f of data.features) {
              const [lon, lat] = f.geometry.coordinates;
              const p = f.properties;
              const name = p.name || p.street || q;
              const details = [p.housenumber, p.street, p.district, p.city || "Hà Nội"]
                .filter(Boolean)
                .join(", ");

              if (!results.some((r) => Math.abs(r.lat - lat) < 0.001 && Math.abs(r.lng - lon) < 0.001)) {
                results.push({
                  name,
                  details: details || "Hà Nội",
                  lat,
                  lng: lon,
                });
              }
            }
          }
        }
      } catch {
        // Fallback silently
      }

      setSearchResults(results.slice(0, 6));
      setShowDropdown(true);
      setIsSearching(false);
    }, 350);
  };

  // Khi chọn một địa điểm từ thanh tìm kiếm
  const handleSelectLocation = (item: { name: string; lat: number; lng: number }) => {
    setSearchQuery(item.name);
    setShowDropdown(false);

    if (mapInstanceRef.current && userMarkerRef.current && polylineRef.current) {
      const latlng = L.latLng(item.lat, item.lng);
      userMarkerRef.current.setLatLng(latlng);
      polylineRef.current.setLatLngs([
        [SHOP_COORDINATES.lat, SHOP_COORDINATES.lng],
        [item.lat, item.lng],
      ]);
      mapInstanceRef.current.flyTo(latlng, 16, { duration: 0.8 });
    }
    updatePin(item.lat, item.lng);
  };

  // Khởi tạo và cập nhật bản đồ Leaflet
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Tránh khởi tạo trùng lặp
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const startLat = initialLat || SHOP_COORDINATES.lat + 0.005;
    const startLng = initialLng || SHOP_COORDINATES.lng + 0.005;
    setCurrentLat(startLat);
    setCurrentLng(startLng);

    // 1. Tạo bản đồ Leaflet
    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: 14,
      zoomControl: false,
    });
    mapInstanceRef.current = map;

    // 2. Tile layer Google Maps (đường phố sắc nét, có tên ngõ ngách, tải nhanh và không bị lỗi xám)
    L.tileLayer("https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      attribution: '&copy; Google Maps',
      subdomains: ["0", "1", "2", "3"],
      maxZoom: 20,
    }).addTo(map);

    // 3. Icon Tiệm Chè Na (Ghim Đỏ)
    const shopIcon = L.divIcon({
      className: "custom-shop-marker",
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
          <div style="background: #ea580c; color: white; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.25); border: 2px solid white; white-space: nowrap; margin-bottom: 2px;">
            🍧 Tiệm Chè Na
          </div>
          <div style="width: 14px; height: 14px; background: #ea580c; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    L.marker([SHOP_COORDINATES.lat, SHOP_COORDINATES.lng], {
      icon: shopIcon,
      interactive: true,
    })
      .addTo(map)
      .bindPopup("<b>Tiệm Chè Na</b><br/>Vũ Lăng, Ngũ Hiệp, Thanh Trì");

    // 4. Icon Ghim của Khách Hàng (Ghim Cam có hiệu ứng Pulse)
    const userIcon = L.divIcon({
      className: "custom-user-marker",
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: grab;">
          <div style="background: #0284c7; color: white; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); border: 1.5px solid white; white-space: nowrap; margin-bottom: 2px;">
            📍 Điểm Giao Hàng (Kéo thả)
          </div>
          <div style="width: 18px; height: 18px; background: #0284c7; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.4);"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const userMarker = L.marker([startLat, startLng], {
      icon: userIcon,
      draggable: true,
    }).addTo(map);
    userMarkerRef.current = userMarker;

    // 5. Đường nối nét đứt giữa Quán và Khách
    const polyline = L.polyline(
      [
        [SHOP_COORDINATES.lat, SHOP_COORDINATES.lng],
        [startLat, startLng],
      ],
      {
        color: "#ea580c",
        weight: 3,
        opacity: 0.8,
        dashArray: "6, 8",
      }
    ).addTo(map);
    polylineRef.current = polyline;

    // Cập nhật khi kéo marker
    userMarker.on("drag", (e: any) => {
      const pos = e.target.getLatLng();
      polyline.setLatLngs([
        [SHOP_COORDINATES.lat, SHOP_COORDINATES.lng],
        [pos.lat, pos.lng],
      ]);
      updatePin(pos.lat, pos.lng);
    });

    // Cập nhật khi click bất kỳ đâu trên bản đồ
    map.on("click", (e: L.LeafletMouseEvent) => {
      userMarker.setLatLng(e.latlng);
      polyline.setLatLngs([
        [SHOP_COORDINATES.lat, SHOP_COORDINATES.lng],
        [e.latlng.lat, e.latlng.lng],
      ]);
      updatePin(e.latlng.lat, e.latlng.lng);
    });

    // Fit bounds để thấy cả quán và ghim
    const bounds = L.latLngBounds([
      [SHOP_COORDINATES.lat, SHOP_COORDINATES.lng],
      [startLat, startLng],
    ]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });

    // Đảm bảo Leaflet tính toán kích thước container sau khi modal mở (fix lỗi map trắng)
    const t1 = setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    }, 150);
    const t2 = setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    }, 450);

    // Dọn dẹp khi unmount
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, initialLat, initialLng, updatePin]);


  // Nút lấy GPS hiện tại ngay trong bản đồ
  const handleLocateMe = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Thiết bị không hỗ trợ định vị GPS.");
      return;
    }

    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        if (mapInstanceRef.current && userMarkerRef.current && polylineRef.current) {
          const latlng = L.latLng(latitude, longitude);
          userMarkerRef.current.setLatLng(latlng);
          polylineRef.current.setLatLngs([
            [SHOP_COORDINATES.lat, SHOP_COORDINATES.lng],
            [latitude, longitude],
          ]);
          mapInstanceRef.current.setView(latlng, 15, { animate: true });
        }
        updatePin(latitude, longitude);
        setIsLocatingGps(false);
      },
      () => {
        setIsLocatingGps(false);
        alert("Không thể lấy vị trí GPS hiện tại. Vui lòng kéo ghim trên bản đồ.");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleConfirm = () => {
    const nearest = findNearestHanoiWard(currentLat, currentLng);
    const locationName = nearest
      ? `${nearest.wardName}, ${nearest.districtName}`
      : `Tọa độ (${currentLat.toFixed(4)}, ${currentLng.toFixed(4)})`;

    onConfirmLocation({
      lat: currentLat,
      lng: currentLng,
      distanceKm,
      shippingFee: feeInfo.shippingFee,
      isWithinRange: feeInfo.isWithinRange,
      locationName,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header Modal */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">Ghim Vị Trí Giao Hàng</h3>
              <p className="text-[11px] text-slate-500">Tìm kiếm địa chỉ hoặc kéo thả ghim đến nhà bạn</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh tìm kiếm vị trí & địa chỉ */}
        <div className="relative z-30 p-2.5 bg-white border-b border-slate-200 shadow-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              placeholder="🔍 Nhập số nhà, tên đường, KĐT, xã phường..."
              className="w-full pl-9 pr-9 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-hidden transition shadow-inner"
            />
            {isSearching ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 animate-spin" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setShowDropdown(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Gợi ý kết quả tìm kiếm Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute left-2.5 right-2.5 top-[calc(100%+4px)] z-50 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectLocation(item)}
                  className="w-full px-3 py-2.5 text-left flex items-start gap-2.5 hover:bg-orange-50/80 transition cursor-pointer group"
                >
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate group-hover:text-orange-600">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {item.details}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Khung bản đồ Leaflet */}
        <div className="relative flex-1 min-h-[340px] sm:min-h-[400px] h-[340px] sm:h-[400px] w-full bg-slate-100 overflow-hidden">
          <style dangerouslySetInnerHTML={{
            __html: `
              .leaflet-container img {
                max-width: none !important;
                max-height: none !important;
              }
              .leaflet-tile {
                visibility: inherit !important;
              }
            `
          }} />
          <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: "340px", height: "100%" }} />

          {/* Nút bấm định vị GPS trên bản đồ */}
          <div className="absolute right-3 bottom-3 z-20 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocatingGps}
              className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-lg border border-slate-200/80 transition cursor-pointer active:scale-95 flex items-center gap-1.5 text-xs font-bold"
              title="Lấy vị trí GPS của tôi"
            >
              {isLocatingGps ? (
                <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
              ) : (
                <Navigation className="w-4 h-4 text-orange-600" />
              )}
              <span className="hidden sm:inline">Vị trí của tôi</span>
            </button>
          </div>

          {/* Hướng dẫn nhanh */}
          <div className="absolute left-3 top-3 z-20 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl shadow-md border border-slate-200/80 text-[11px] font-semibold text-slate-700 pointer-events-none">
            📍 Chạm hoặc kéo ghim để chỉnh vị trí
          </div>
        </div>

        {/* Footer: Thông tin khoảng cách & nút xác nhận */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                <span>🚗 Khoảng cách {osrmKm ? "thực tế" : "(ước lượng)"}:</span>
                <span className="text-orange-600 font-black">{distanceKm} km</span>
                {isFetchingOsrm && (
                  <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {osrmKm
                  ? "Khoảng cách đường bộ thực tế (OSRM / OpenStreetMap)"
                  : "Ước lượng đường xe máy (Haversine × 1.4)—đang tính chính xác..."}
              </p>
            </div>

            <div className="text-right">
              <div className="text-[11px] text-slate-500 font-medium">Phí giao hàng:</div>
              <div className="text-sm font-black text-emerald-600">
                {feeInfo.isWithinRange ? `${feeInfo.shippingFee.toLocaleString("vi-VN")}đ` : "Quá xa"}
              </div>
            </div>
          </div>

          {!feeInfo.isWithinRange && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-[11px] text-red-700 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>Khoảng cách vượt quá bán kính giao hàng 5 km của quán!</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!feeInfo.isWithinRange}
              className="flex-1 py-2.5 px-3 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white text-xs font-extrabold rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              <span>Xác Nhận Vị Trí Này</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
