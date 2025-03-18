import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ArrowLeft, X, Camera, Check, Upload } from "@phosphor-icons/react";
import { useTheme } from "../../hooks/useTheme";
import axios from "axios";
import { updateUser } from "../../redux/authSlice";

export default function UserSettings({ onClose }) {
  const dispatch = useDispatch();
  const { colors, styles, getButtonStyle } = useTheme();
  const { user } = useSelector((state) => state.auth);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    bio: user?.bio || "",
    gender: user?.gender || ""
  });
  
  // UI state
  const [image, setImage] = useState(user?.imgSrc || null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Reset form with user data on user change
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        bio: user.bio || "",
        gender: user.gender || ""
      });
      setImage(user.imgSrc || null);
    }
  }, [user]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImageFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create form data for file upload
      const data = new FormData();
      data.append("fullName", formData.fullName);
      data.append("email", formData.email);
      data.append("bio", formData.bio);
      data.append("gender", formData.gender);
      
      if (imageFile) {
        data.append("profilePicture", imageFile);
      }
      
      // Make API request
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/profile`,
        data,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );
      
      // Update Redux store with new user data
      dispatch(updateUser(response.data));
      
      setSuccess("Profile updated successfully");
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000); // Clear success message after 3 seconds
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };
  
  // Start editing
  const startEditing = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setError(null);
    
    // Reset form
    setFormData({
      fullName: user?.fullName || "",
      email: user?.email || "",
      bio: user?.bio || "",
      gender: user?.gender || ""
    });
    setImage(user?.imgSrc || null);
    setImageFile(null);
  };
  
  return (
    <div className="h-full flex flex-col" style={styles.container}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.borderColor }}>
        <button
          onClick={onClose}
          style={getButtonStyle()}
          className="w-10 h-10 flex items-center justify-center rounded-lg"
        >
          <ArrowLeft size={18} style={{ color: colors.accentPrimary }} />
        </button>
        
        <h2 style={styles.text.primary} className="font-medium">
          Settings
        </h2>
        
        <div className="w-10 h-10"></div> {/* Empty div for alignment */}
      </div>
      
      {/* Settings content */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit}>
          {/* Profile section */}
          <section className="mb-8">
            <h3 style={styles.text.primary} className="font-medium mb-6">
              Profile Settings
            </h3>
            
            {/* Profile picture */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                <div 
                  className="w-24 h-24 rounded-full overflow-hidden"
                  style={{ 
                    boxShadow: colors.buttonShadow,
                    background: colors.background
                  }}
                >
                  {image ? (
                    <img 
                      src={image} 
                      alt={formData.fullName || "User"} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-3xl font-bold"
                      style={{ color: colors.accentPrimary }}  
                    >
                      {formData.fullName?.charAt(0) || user?.email?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                
                {isEditing && (
                  <label
                    htmlFor="profileImage"
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                    style={{ 
                      background: colors.accentPrimary,
                      color: "#fff"
                    }}
                  >
                    <Camera size={16} weight="bold" />
                    <input 
                      type="file" 
                      id="profileImage"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              
              {!isEditing && (
                <button
                  type="button"
                  onClick={startEditing}
                  className="px-4 py-2 rounded-lg"
                  style={getButtonStyle('primary')}
                >
                  Edit Profile
                </button>
              )}
            </div>
            
            {/* Form fields */}
            <div className="space-y-4">
              {/* Full name */}
              <div>
                <label 
                  htmlFor="fullName" 
                  style={styles.text.secondary}
                  className="block mb-2 text-sm"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full py-3 px-4 rounded-lg outline-none transition-all"
                  style={styles.input}
                  placeholder="Your full name"
                />
              </div>
              
              {/* Email */}
              <div>
                <label 
                  htmlFor="email" 
                  style={styles.text.secondary}
                  className="block mb-2 text-sm"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full py-3 px-4 rounded-lg outline-none transition-all"
                  style={styles.input}
                  placeholder="Your email address"
                />
              </div>
              
              {/* Bio */}
              <div>
                <label 
                  htmlFor="bio" 
                  style={styles.text.secondary}
                  className="block mb-2 text-sm"
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full py-3 px-4 rounded-lg outline-none transition-all resize-none"
                  style={styles.input}
                  placeholder="Write something about yourself"
                />
              </div>
              
              {/* Gender */}
              <div>
                <label 
                  htmlFor="gender" 
                  style={styles.text.secondary}
                  className="block mb-2 text-sm"
                >
                  Gender (Optional)
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full py-3 px-4 rounded-lg outline-none transition-all"
                  style={styles.input}
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            {/* Form buttons */}
            {isEditing && (
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg flex items-center justify-center"
                  style={getButtonStyle('primary')}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Check size={16} className="mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg"
                  style={getButtonStyle()}
                >
                  Cancel
                </button>
              </div>
            )}
            
            {/* Status messages */}
            {error && (
              <div 
                className="mt-4 p-3 rounded-lg text-sm"
                style={{ 
                  background: "rgba(255, 0, 0, 0.1)",
                  color: "#ff0000"
                }}
              >
                {error}
              </div>
            )}
            
            {success && (
              <div 
                className="mt-4 p-3 rounded-lg text-sm"
                style={{ 
                  background: "rgba(0, 255, 0, 0.1)",
                  color: "#00aa00"
                }}
              >
                {success}
              </div>
            )}
          </section>
          
          {/* Account settings section */}
          <section>
            <h3 style={styles.text.primary} className="font-medium mb-6">
              Account Settings
            </h3>
            
            <div style={styles.card} className="rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 style={styles.text.primary} className="font-medium">
                    Privacy
                  </h4>
                  <p style={styles.text.secondary} className="text-sm">
                    Manage your privacy settings
                  </p>
                </div>
                <button
                  type="button"
                  className="px-3 py-1 rounded text-sm"
                  style={getButtonStyle()}
                  onClick={() => alert("Privacy settings would open here")}
                >
                  Manage
                </button>
              </div>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
} 