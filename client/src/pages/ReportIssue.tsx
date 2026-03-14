// Feature 2b: Report an Issue — photo, pin, submit. Stupid simple.
// Works on a 4-year-old Android phone with mediocre signal.
import { useState, useEffect, useRef } from "react";
import api from "../lib/api";
import { categoryLabel } from "../lib/format";

const CATEGORIES = [
  { value: "roads", label: "Roads & Sidewalks" },
  { value: "water", label: "Water & Sewage" },
  { value: "lighting", label: "Street Lighting" },
  { value: "parks", label: "Parks & Recreation" },
  { value: "sanitation", label: "Sanitation & Trash" },
  { value: "other", label: "Other" },
];

export default function ReportIssue() {
  const [cityId, setCityId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("roads");
  const [address, setAddress] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCity();
    getLocation();
  }, []);

  async function loadCity() {
    try {
      const res: any = await api.get("/cities");
      if (res.data[0]) setCityId(res.data[0].id);
    } catch (err) {
      console.error("Failed to load city:", err);
    }
  }

  function getLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationStatus("success");
      },
      () => {
        // Default to Odessa, TX center
        setLatitude(31.9456);
        setLongitude(-102.0989);
        setLocationStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 5 - photos.length);
    setPhotos((prev) => [...prev, ...files]);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPhotoPreviewUrls((prev) => [...prev, ...urls]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cityId || latitude === null || longitude === null) return;

    setSubmitting(true);
    setError("");

    try {
      // Upload photos first
      const uploadedUrls: string[] = [];
      for (const photo of photos) {
        const formData = new FormData();
        formData.append("photo", photo);
        const uploadRes: any = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedUrls.push(uploadRes.data.url);
      }

      // Create the issue
      await api.post("/issues", {
        cityId,
        title,
        description,
        category,
        latitude,
        longitude,
        address: address || undefined,
        photoUrls: uploadedUrls,
        anonymous,
      });

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit issue. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">&#10003;</div>
        <h1 className="text-2xl font-black text-navy-800">Issue Reported</h1>
        <p className="text-gray-600 mt-2">
          Your report is now public and on the map. Share it to get more signatures
          and apply pressure for a fix.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/issues"
            className="bg-navy-800 hover:bg-navy-700 text-white px-6 py-3 rounded-lg font-bold text-sm transition-colors"
          >
            View All Issues
          </a>
          <button
            onClick={() => {
              setSubmitted(false);
              setTitle("");
              setDescription("");
              setPhotos([]);
              setPhotoPreviewUrls([]);
            }}
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-bold text-sm transition-colors"
          >
            Report Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-black text-navy-800">Report an Issue</h1>
      <p className="text-gray-600 mt-1 mb-8">
        See something broken? Report it. Pin it. Make it undeniable.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            What's the problem?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  category === cat.value
                    ? "bg-navy-800 text-white border-navy-800"
                    : "bg-white text-gray-700 border-gray-300 hover:border-navy-300"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1">
            Short description
          </label>
          <input
            id="title"
            type="text"
            required
            maxLength={200}
            placeholder="e.g., Massive pothole on E 42nd Street"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">
            Tell us more
          </label>
          <textarea
            id="description"
            required
            rows={4}
            maxLength={5000}
            placeholder="What did you see? How long has it been like this? How does it affect you and your neighbors?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Photo upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Photos (up to 5)
          </label>
          <div className="flex flex-wrap gap-2">
            {photoPreviewUrls.map((url, i) => (
              <div key={i} className="relative w-20 h-20">
                <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-civic-red text-white rounded-full text-xs flex items-center justify-center"
                  aria-label="Remove photo"
                >
                  &times;
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-navy-300 hover:text-navy-500 transition-colors"
                aria-label="Add photo"
              >
                <span className="text-2xl">+</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoSelect}
            className="hidden"
            aria-label="Upload photo"
          />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-1">
            Location
          </label>
          <p className="text-xs text-gray-500 mb-2">
            {locationStatus === "success"
              ? `GPS: ${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`
              : locationStatus === "loading"
                ? "Getting your location..."
                : "Using default location. Enter address for accuracy."}
          </p>
          <input
            id="address"
            type="text"
            placeholder="Street address or intersection"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
          />
        </div>

        {/* Anonymous option */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-navy-800 focus:ring-navy-500"
          />
          <span className="text-sm text-gray-700">Submit anonymously</span>
        </label>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-civic-red px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !title || !description || !cityId}
          className="w-full bg-civic-red hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-bold text-base transition-colors"
        >
          {submitting ? "Submitting..." : "Report This Issue"}
        </button>
      </form>
    </div>
  );
}
