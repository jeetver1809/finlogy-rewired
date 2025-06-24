// import React, { useState, useEffect } from 'react';
// import { Link, Navigate } from 'react-router-dom';
// import { useForm } from 'react-hook-form';
// import { yupResolver } from '@hookform/resolvers/yup';
// import * as yup from 'yup';
// import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
// import { useAuth } from '../../context/AuthContext';
// import LoadingSpinner from '../../components/ui/LoadingSpinner';
// import OAuthButton from '../../components/ui/OAuthButton';
// import Logo from '../../components/ui/Logo';
// import FormIcon from '../../components/ui/FormIcon';
// import { motion } from 'framer-motion';
// import { useInView } from 'react-intersection-observer';

// // Validation schema
// const schema = yup.object({
//   email: yup.string().email('Invalid email').required('Email is required'),
//   password: yup.string().required('Password is required'),
// });

// const LoginMoneyvine = () => {
//   const [showPassword, setShowPassword] = useState(false);
//   const [oauthLoading, setOauthLoading] = useState(null);
//   const [loginError, setLoginError] = useState('');
//   const { login, isAuthenticated, isLoading, initiateOAuth } = useAuth();
//   const [ref, inView] = useInView({
//     threshold: 0.1,
//     triggerOnce: true,
//   });

//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//     watch,
//   } = useForm({
//     resolver: yupResolver(schema),
//   });

//   // Clear login error when user starts typing
//   const watchedFields = watch(['email', 'password']);
//   useEffect(() => {
//     if (loginError && (watchedFields[0] || watchedFields[1])) {
//       setLoginError('');
//     }
//   }, [watchedFields, loginError]);

//   useEffect(() => {
//     document.body.style.overflow = 'hidden';
//     return () => {
//       document.body.style.overflow = 'unset';
//     };
//   }, []);

//   if (isAuthenticated) {
//     return <Navigate to="/dashboard" replace />;
//   }

//   const onSubmit = async (data) => {
//     console.log('🚀 onSubmit called with data:', data);

//     try {
//       // Clear any previous error
//       setLoginError('');
//       console.log('✅ Cleared previous error');

//       console.log('📡 Calling login function...');
//       const result = await login(data, { suppressErrorToast: true });
//       console.log('📥 Login function completed, result:', result);

//       // If login failed, show error message
//       if (result && !result.success) {
//         console.log('❌ Login failed, showing error message');
//         setLoginError('Invalid email or password. Please try again.');
//         console.log('🔴 Error state set');

//         // Focus back to password field for easy correction
//         const passwordField = document.querySelector('input[type="password"]');
//         if (passwordField) {
//           setTimeout(() => passwordField.focus(), 100);
//         }
//       } else if (result && result.success) {
//         console.log('✅ Login successful!');
//       } else {
//         console.log('⚠️ Unexpected result format:', result);
//         setLoginError('Invalid email or password. Please try again.');
//       }
//     } catch (error) {
//       console.error('💥 Login error caught:', error);
//       setLoginError('Invalid email or password. Please try again.');
//       console.log('🔴 Error state set from catch block');

//       // Focus back to password field for easy correction
//       const passwordField = document.querySelector('input[type="password"]');
//       if (passwordField) {
//         setTimeout(() => passwordField.focus(), 100);
//       }
//     }
//   };

//   const handleOAuthSignIn = async (provider) => {
//     try {
//       setOauthLoading(provider);
//       await initiateOAuth(provider);
//     } catch (error) {
//       console.error(`${provider} OAuth error:`, error);
//     } finally {
//       setOauthLoading(null);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-blue-900 flex">
//       {/* Left Side - Branding & Hero */}
//       <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden">
//         {/* Background Pattern */}
//         <div className="absolute inset-0 opacity-10">
//           <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-3xl"></div>
//           <div className="absolute bottom-40 right-20 w-24 h-24 bg-blue-300 rounded-full blur-2xl"></div>
//           <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-slate-300 rounded-full blur-xl"></div>
//         </div>
        
//         {/* Logo */}
//         <motion.div 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6 }}
//           className="relative z-10"
//         >
//           <Logo size="md" useCustomIcon={true} className="text-white" />
//         </motion.div>

//         {/* Hero Content */}
//         <div className="relative z-10 space-y-8">
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8, delay: 0.2 }}
//           >
//             <h1 className="text-5xl font-bold leading-tight mb-6">
//               Your wealth,<br />
//               <span className="text-blue-300">Your Identity.</span>
//             </h1>
//             <p className="text-xl text-slate-100 leading-relaxed">
//               Take control of your financial future with Finlogy the intelligent money management platform.
//             </p>
//           </motion.div>

//           {/* 3D Illustration */}
//           <motion.div
//             initial={{ opacity: 0, scale: 0.8 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ duration: 1, delay: 0.4 }}
//             className="relative"
//           >
//             <div className="w-80 h-60 mx-auto relative">
//               {/* Phone Mockup */}
//               <div className="absolute inset-0 bg-gradient-to-br from-slate-600 to-blue-700 rounded-3xl shadow-2xl transform rotate-12 scale-90">
//                 <div className="p-6 h-full flex flex-col justify-center items-center">
//                   <div className="w-16 h-16 bg-white/20 rounded-2xl mb-4 flex items-center justify-center">
//                     <FormIcon type="finance" size="lg" className="text-white" />
//                   </div>
//                   <div className="space-y-2 w-full">
//                     <div className="h-2 bg-white/30 rounded w-3/4 mx-auto"></div>
//                     <div className="h-2 bg-white/20 rounded w-1/2 mx-auto"></div>
//                   </div>
//                 </div>
//               </div>
              
//               {/* Card Mockup */}
//               <div className="absolute top-8 -right-4 w-32 h-20 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl shadow-xl transform -rotate-12">
//                 <div className="p-3 h-full flex flex-col justify-between">
//                   <div className="w-8 h-2 bg-white/40 rounded"></div>
//                   <div className="space-y-1">
//                     <div className="h-1 bg-white/60 rounded w-full"></div>
//                     <div className="h-1 bg-white/40 rounded w-2/3"></div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         </div>

//         {/* Footer */}
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ duration: 0.6, delay: 1 }}
//           className="relative z-10 text-sm text-slate-200"
//         >
//           © 2025 Finlogy. All rights reserved.
//         </motion.div>
//       </div>

//       {/* Right Side - Login Form */}
//       <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
//         <motion.div
//           initial={{ opacity: 0, x: 20 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ duration: 0.6 }}
//           className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 lg:p-10"
//           ref={ref}
//         >
//           {/* Mobile Logo */}
//           <div className="lg:hidden flex justify-center mb-8">
//             <Logo size="lg" useCustomIcon={true} />
//           </div>

//           <div className="space-y-6">
//             <div>
//               <h2 className="text-3xl font-bold text-gray-900 mb-2">Login</h2>
//               <p className="text-gray-600">Welcome back! Please sign in to your account.</p>
//             </div>

//             {/* OAuth Button */}
//             <OAuthButton
//               provider="google"
//               onClick={() => handleOAuthSignIn('google')}
//               isLoading={oauthLoading === 'google'}
//               disabled={oauthLoading !== null}
//               className="w-full justify-center py-3 px-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-medium shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
//             >
//               Continue with Google
//             </OAuthButton>

//             {/* Divider */}
//             <div className="relative">
//               <div className="absolute inset-0 flex items-center">
//                 <div className="w-full border-t border-gray-200" />
//               </div>
//               <div className="relative flex justify-center text-sm">
//                 <span className="px-4 bg-white text-gray-500 font-medium">
//                   Or sign in with email
//                 </span>
//               </div>
//             </div>

//             {/* Login Form */}
//             <form
//               className="space-y-5"
//               onSubmit={(e) => {
//                 e.preventDefault();
//                 handleSubmit(onSubmit)(e);
//               }}
//             >
//               <div>
//                 <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
//                   Email*
//                 </label>
//                 <input
//                   {...register('email')}
//                   type="email"
//                   autoComplete="email"
//                   className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400 ${errors.email ? 'border-red-300 focus:ring-red-500' : 'hover:border-gray-300'}`}
//                   placeholder="Enter your email address"
//                 />
//                 {errors.email && (
//                   <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
//                 )}
//               </div>

//               <div>
//                 <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
//                   Password*
//                 </label>
//                 <div className="relative">
//                   <input
//                     {...register('password')}
//                     type={showPassword ? 'text' : 'password'}
//                     autoComplete="current-password"
//                     className={`w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400 ${errors.password ? 'border-red-300 focus:ring-red-500' : 'hover:border-gray-300'}`}
//                     placeholder="Enter password"
//                   />
//                   <button
//                     type="button"
//                     className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
//                     onClick={() => setShowPassword(!showPassword)}
//                   >
//                     {showPassword ? (
//                       <EyeSlashIcon className="h-5 w-5" />
//                     ) : (
//                       <EyeIcon className="h-5 w-5" />
//                     )}
//                   </button>
//                 </div>
//                 {errors.password && (
//                   <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
//                 )}
//               </div>

//               <div className="flex items-center justify-between">
//                 <div className="text-sm">
//                   <Link
//                     to="/forgot-password"
//                     className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
//                   >
//                     Forgot password? Reset
//                   </Link>
//                 </div>
//               </div>

//               {/* Login Error Message */}
//               {loginError && (
//                 <motion.div
//                   initial={{ opacity: 0, y: -10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: -10 }}
//                   transition={{ duration: 0.3 }}
//                   className="bg-red-50 border border-red-200 rounded-lg p-3"
//                 >
//                   <p className="text-sm text-red-600 font-medium flex items-center">
//                     <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                     </svg>
//                     {loginError}
//                   </p>
//                 </motion.div>
//               )}

//               <button
//                 type="submit"
//                 disabled={isSubmitting}
//                 className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {isSubmitting ? (
//                   <LoadingSpinner size="sm" className="mr-2" />
//                 ) : null}
//                 Login
//               </button>
//             </form>

//             <div className="text-center text-sm text-gray-600">
//               Don't have an account?{' '}
//               <Link
//                 to="/register"
//                 className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
//               >
//                 Sign up here
//               </Link>
//             </div>
//           </div>
//         </motion.div>
//       </div>
//     </div>
//   );
// };

// export default LoginMoneyvine;
//neww inmplemebtation

import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import OAuthButton from '../../components/ui/OAuthButton';
import Logo from '../../components/ui/Logo';
import FormIcon from '../../components/ui/FormIcon';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

// Validation schema
const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

const LoginMoneyvine = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);
  const [loginError, setLoginError] = useState('');
  const { login, isAuthenticated, isLoading, initiateOAuth } = useAuth();
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    resolver: yupResolver(schema),
  });

  // Clear login error when user starts typing
  const watchedFields = watch(['email', 'password']);
  useEffect(() => {
    if (loginError && (watchedFields[0] || watchedFields[1])) {
      setLoginError('');
    }
  }, [watchedFields, loginError]);

  // Remove the overflow hidden effect for better mobile experience

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data) => {
    console.log('🚀 onSubmit called with data:', data);

    try {
      // Clear any previous error
      setLoginError('');
      console.log('✅ Cleared previous error');

      console.log('📡 Calling login function...');
      const result = await login(data, { suppressErrorToast: true });
      console.log('📥 Login function completed, result:', result);

      // If login failed, show error message
      if (result && !result.success) {
        console.log('❌ Login failed, showing error message');
        setLoginError('Invalid email or password. Please try again.');
        console.log('🔴 Error state set');

        // Focus back to password field for easy correction
        const passwordField = document.querySelector('input[type="password"]');
        if (passwordField) {
          setTimeout(() => passwordField.focus(), 100);
        }
      } else if (result && result.success) {
        console.log('✅ Login successful!');
      } else {
        console.log('⚠️ Unexpected result format:', result);
        setLoginError('Invalid email or password. Please try again.');
      }
    } catch (error) {
      console.error('💥 Login error caught:', error);
      setLoginError('Invalid email or password. Please try again.');
      console.log('🔴 Error state set from catch block');

      // Focus back to password field for easy correction
      const passwordField = document.querySelector('input[type="password"]');
      if (passwordField) {
        setTimeout(() => passwordField.focus(), 100);
      }
    }
  };

  const handleOAuthSignIn = async (provider) => {
    try {
      setOauthLoading(provider);
      await initiateOAuth(provider);
    } catch (error) {
      console.error(`${provider} OAuth error:`, error);
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-blue-900 flex flex-col lg:flex-row">
      {/* Left Side - Branding & Hero */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 right-20 w-24 h-24 bg-blue-300 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-slate-300 rounded-full blur-xl"></div>
        </div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <Logo size="md" useCustomIcon={true} className="text-white" />
        </motion.div>

        {/* Hero Content */}
        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Your wealth,<br />
              <span className="text-blue-300">Your Identity.</span>
            </h1>
            <p className="text-xl text-slate-100 leading-relaxed">
              Take control of your financial future with Finlogy the intelligent money management platform.
            </p>
          </motion.div>

          {/* 3D Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative"
          >
            <div className="w-80 h-60 mx-auto relative">
              {/* Phone Mockup */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-600 to-blue-700 rounded-3xl shadow-2xl transform rotate-12 scale-90">
                <div className="p-6 h-full flex flex-col justify-center items-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl mb-4 flex items-center justify-center">
                    <FormIcon type="finance" size="lg" className="text-white" />
                  </div>
                  <div className="space-y-2 w-full">
                    <div className="h-2 bg-white/30 rounded w-3/4 mx-auto"></div>
                    <div className="h-2 bg-white/20 rounded w-1/2 mx-auto"></div>
                  </div>
                </div>
              </div>
              
              {/* Card Mockup */}
              <div className="absolute top-8 -right-4 w-32 h-20 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl shadow-xl transform -rotate-12">
                <div className="p-3 h-full flex flex-col justify-between">
                  <div className="w-8 h-2 bg-white/40 rounded"></div>
                  <div className="space-y-1">
                    <div className="h-1 bg-white/60 rounded w-full"></div>
                    <div className="h-1 bg-white/40 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="relative z-10 text-sm text-slate-200"
        >
          © 2025 Finlogy. All rights reserved.
        </motion.div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-screen lg:min-h-0">
        {/* Mobile Layout - Enhanced Card Design */}
        <div className="lg:hidden w-full max-w-sm mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-6 relative overflow-hidden"
          >
            {/* Glassmorphism background effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white/10 to-purple-50/20 rounded-3xl"></div>
            <div className="relative z-10">

            {/* Optimized Mobile Header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: -10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                className="mb-6 flex justify-center"
              >
                {/* Enhanced SVG Icon as Primary Branding */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl scale-110"></div>
                  <div className="relative">
                    <img
                      src="/icons/light mode icons/vector/default-monochrome-black.svg"
                      alt="Finlogy"
                      className="w-30 h-16"
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="space-y-2"
              >
                <h2 className="text-lg font-semibold text-gray-800">
                  Login here
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed max-w-xs mx-auto">
                  Welcome back you've been missed!
                </p>
              </motion.div>
            </div>

            {/* Priority Google OAuth Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mb-6"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={oauthLoading === 'google'}
                  className="w-full flex items-center justify-center py-3 px-4 border border-gray-800/20 rounded-xl bg-black hover:bg-gray-900 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 text-sm min-h-[48px] disabled:opacity-50"
                >
                  {oauthLoading === 'google' ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Continue with Google
                </button>
              </motion.div>
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mb-6"
            >
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200/60" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/90 text-gray-500 font-medium">
                    Or sign in with email
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Mobile Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(onSubmit)(e);
              }}
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 placeholder-gray-400 text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg ${errors.email ? 'border-red-300 focus:ring-red-500 bg-red-50/50' : 'border-gray-200/60 hover:border-blue-300'}`}
                  placeholder="Email"
                />
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600 font-medium"
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
              >
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`w-full px-4 py-4 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 placeholder-gray-400 text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg ${errors.password ? 'border-red-300 focus:ring-red-500 bg-red-50/50' : 'border-gray-200/60 hover:border-blue-300'}`}
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-all duration-200 hover:scale-110"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600 font-medium"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.1 }}
                className="text-right"
              >
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 hover:underline"
                >
                  Forgot your password?
                </Link>
              </motion.div>

              {/* Login Error Message */}
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-xl p-4 shadow-sm"
                >
                  <p className="text-sm text-red-600 font-medium flex items-center">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {loginError}
                  </p>
                </motion.div>
              )}

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center shadow-lg hover:shadow-blue-500/25"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : null}
                Sign in
              </motion.button>
            </motion.form>

            {/* Enhanced Call-to-Action */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.3 }}
              className="mt-8 text-center"
            >
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100/50">
                <p className="text-sm text-gray-600 mb-2">Don't have an account?</p>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:scale-105 hover:shadow-lg text-sm"
                >
                  Create new account
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Desktop Layout - Keep Original */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block w-full max-w-md bg-white rounded-2xl lg:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 my-4 lg:my-0"
          ref={ref}
        >
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Login</h2>
              <p className="text-gray-600">Welcome back! Please sign in to your account.</p>
            </div>

            {/* OAuth Button */}
            <OAuthButton
              provider="google"
              onClick={() => handleOAuthSignIn('google')}
              isLoading={oauthLoading === 'google'}
              disabled={oauthLoading !== null}
              className="w-full justify-center py-3 sm:py-3 px-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-medium shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] text-sm sm:text-base min-h-[48px]"
            >
              Continue with Google
            </OAuthButton>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">
                  Or sign in with email
                </span>
              </div>
            </div>

            {/* Login Form */}
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(onSubmit)(e);
              }}
            >
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email*
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className={`w-full px-3 sm:px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400 text-sm sm:text-base min-h-[48px] ${errors.email ? 'border-red-300 focus:ring-red-500' : 'hover:border-gray-300'}`}
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password*
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`w-full px-3 sm:px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400 text-sm sm:text-base min-h-[48px] ${errors.password ? 'border-red-300 focus:ring-red-500' : 'hover:border-gray-300'}`}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors min-h-[48px]"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
                  >
                    Forgot password? Reset
                  </Link>
                </div>
              </div>

              {/* Login Error Message */}
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-3"
                >
                  <p className="text-sm text-red-600 font-medium flex items-center">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {loginError}
                  </p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[48px] flex items-center justify-center"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : null}
                Login
              </button>
            </form>

            <div className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
              >
                Sign up here
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginMoneyvine;

