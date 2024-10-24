    import React, { useState, ChangeEvent, FormEvent } from 'react';
import { updateProfile } from '../../../api/profile';
import { UserProfile } from '../../../types/user';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaBirthdayCake, FaImage, FaPen, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { useUser } from '@clerk/clerk-react';

   interface ProfileCompletionFormProps {
  initialData: {
    username?: string | null;
    dob?: string | null;
    picture?: string | null;
    description?: string | null;
    clerkImageUrl?: string | null;
  };
  onSuccess: (updatedProfile: UserProfile) => void;
  onClose: () => void;
}

   const ProfileCompletionForm: React.FC<ProfileCompletionFormProps> = ({
     initialData,
     onSuccess,
     onClose,
   }) => {
     const { user: clerkUser } = useUser();
     const [formData, setFormData] = useState({
       username: initialData.username || '',
       dob: initialData.dob || '',
       picture: null as File | null,
       description: initialData.description || '',
       currentPictureUrl: initialData.picture || initialData.clerkImageUrl || '',
     });
     const [errors, setErrors] = useState<{ [key: string]: string }>({});
     const [submitting, setSubmitting] = useState(false);
     const [successMessage, setSuccessMessage] = useState('');

     const handleChange = (
       e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
     ) => {
       const { name, value, files } = e.target as HTMLInputElement;
       if (name === 'picture' && files) {
         setFormData((prev) => ({
           ...prev,
           picture: files[0],
           currentPictureUrl: URL.createObjectURL(files[0]),
         }));
       } else {
         setFormData((prev) => ({ ...prev, [name]: value }));
       }
     };

     const validate = () => {
       const newErrors: { [key: string]: string } = {};
       if (!formData.username.trim()) {
         newErrors.username = 'Username is required';
       }
       if (formData.dob && isNaN(Date.parse(formData.dob))) {
         newErrors.dob = 'Date of Birth must be a valid date';
       }
       if (formData.description && formData.description.length > 500) {
         newErrors.description = 'Description cannot exceed 500 characters';
       }
       setErrors(newErrors);
       return Object.keys(newErrors).length === 0;
     };

     const handleSubmit = async (e: FormEvent) => {
       e.preventDefault();
       if (!validate()) return;

       setSubmitting(true);

       const payload = new FormData();
       payload.append('username', formData.username);
       if (formData.dob) payload.append('dob', formData.dob);
       if (formData.picture) {
         payload.append('picture', formData.picture);
       }
       if (formData.description) payload.append('description', formData.description);

       try {
         // Update backend profile
         const response = await updateProfile(payload);
         console.log('Profile update response:', response);

         // Update Clerk user data
         await clerkUser?.update({
          username: formData.username,
          });

          if (formData.picture) {
  await clerkUser?.setProfileImage({
    file: formData.picture,
  });
}

         setSuccessMessage('Profile updated successfully!');
         setTimeout(() => {
           onSuccess(response);
         }, 1500);
       } catch (error: any) {
         console.error('Profile update error:', error.response || error);
         setErrors({
           api:
             error.response?.data?.message ||
             'An error occurred while updating your profile.',
         });
       } finally {
         setSubmitting(false);
       }
     };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-[#fa7517] to-[#ff9a5a] text-transparent bg-clip-text">Edit Profile</h2>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <FaTimes size={24} />
        </motion.button>
      </div>

      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center bg-green-500 bg-opacity-20 text-green-500 p-4 rounded-lg mb-4"
          >
            <FaCheckCircle className="mr-2" />
            <p>{successMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6">
        <InputField
          icon={<FaUser />}
          label="Username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          error={errors.username}
          required
        />

        <InputField
          icon={<FaBirthdayCake />}
          label="Date of Birth"
          name="dob"
          type="date"
          value={formData.dob}
          onChange={handleChange}
          error={errors.dob}
        />

        <div className="relative">
          <label htmlFor="picture" className="block text-sm font-medium text-gray-300 mb-1">
            Profile Picture
          </label>
          <div className="flex items-center space-x-4">
            <img
              src={formData.picture ? URL.createObjectURL(formData.picture) : formData.currentPictureUrl}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className="relative flex-1">
              <input
                type="file"
                name="picture"
                id="picture"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
              />
              <label
                htmlFor="picture"
                className="flex items-center justify-center w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors duration-300"
              >
                <FaImage className="mr-2 text-[#fa7517]" />
                <span className="text-gray-300">
                  {formData.picture ? formData.picture.name : 'Choose new picture'}
                </span>
              </label>
            </div>
          </div>
          {errors.picture && <p className="text-red-500 text-sm mt-1">{errors.picture}</p>}
        </div>

        <div className="relative">
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
            Description/Bio
          </label>
          <div className="relative">
            <FaPen className="absolute left-3 top-3 text-gray-400" />
            <textarea
              name="description"
              id="description"
              value={formData.description}
              onChange={handleChange}
              maxLength={500}
              className="w-full p-2 pl-10 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#fa7517] resize-none h-32"
            />
          </div>
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          <p className="text-gray-400 text-sm mt-1">
            {formData.description.length}/500 characters
          </p>
        </div>

        {errors.api && <p className="text-red-500 text-sm">{errors.api}</p>}

        <motion.button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-3 bg-gradient-to-r from-[#fa7517] to-[#ff9a5a] text-white font-bold rounded-lg hover:shadow-lg transition-all duration-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {submitting ? 'Updating...' : 'Update Profile'}
        </motion.button>
      </form>
    </>
  );
};

interface InputFieldProps {
  icon: React.ReactNode;
  label: string;
  name: string;
  type: string;
  value?: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  accept?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  icon,
  label,
  name,
  type,
  value,
  onChange,
  error,
  required,
  accept,
}) => (
  <div className="relative">
    <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        {icon}
      </div>
      <input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        required={required}
        accept={accept}
        className="w-full p-2 pl-10 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#fa7517]"
      />
    </div>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

export default ProfileCompletionForm;