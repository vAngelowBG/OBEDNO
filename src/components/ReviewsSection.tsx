import React, { useState, useEffect } from 'react';
import { Star, Plus, Edit2, Trash2, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { Tables } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface ReviewsSectionProps {
  restaurantId: string;
  restaurantName: string;
}

interface ReviewForm {
  rating: number;
  comment: string;
}

interface ReviewWithUser extends Tables<'reviews'> {
  user_name: string;
}

export function ReviewsSection({ restaurantId, restaurantName }: ReviewsSectionProps) {
  const { user, profile, isAuthenticated } = useAuthContext();
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [userReview, setUserReview] = useState<Tables<'reviews'> | null>(null);
  const [showAddReview, setShowAddReview] = useState(false);
  const [editingReview, setEditingReview] = useState<Tables<'reviews'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const reviewsPerPage = 10;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ReviewForm>({
    defaultValues: {
      rating: 5,
      comment: ''
    }
  });

  const watchedRating = watch('rating');

  useEffect(() => {
    fetchReviews();
    if (user) {
      fetchUserReview();
    }
  }, [restaurantId, user, currentPage]);

  useEffect(() => {
    // Refresh reviews when a review is added/updated/deleted
    const handleReviewChange = () => {
      fetchReviews();
      if (user) {
        fetchUserReview();
      }
    };

    // Listen for custom events
    window.addEventListener('reviewChanged', handleReviewChange);
    return () => window.removeEventListener('reviewChanged', handleReviewChange);
  }, [restaurantId, user]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Get total count first
      const { count, error: countError } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .neq('user_id', user?.id || ''); // Exclude user's own review

      if (countError) throw countError;

      const totalCount = count || 0;
      setTotalPages(Math.ceil(totalCount / reviewsPerPage));

      // Get paginated reviews
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .neq('user_id', user?.id || '') // Exclude user's own review
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * reviewsPerPage, currentPage * reviewsPerPage - 1);

      if (error) throw error;

      // Get user names for each review
      const reviewsWithUserNames: ReviewWithUser[] = [];
      
      if (reviewsData && reviewsData.length > 0) {
        for (const review of reviewsData) {
          let userName = 'Потребител';
          
          try {
            // Get profile for this user
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name')
              .eq('user_id', review.user_id)
              .single();
            
            if (profileData) {
              userName = profileData.name;
            }
          } catch (profileError) {
            console.log('Could not fetch profile for user:', review.user_id);
          }
          
          reviewsWithUserNames.push({
            ...review,
            user_name: userName
          });
        }
      }
      
      setReviews(reviewsWithUserNames);

      // Calculate average rating and count for all reviews
      const { data: allReviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('restaurant_id', restaurantId);
      
      if (allReviews && allReviews.length > 0) {
        const avg = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;
        setAverageRating(Math.round(avg * 10) / 10);
        setReviewCount(allReviews.length);
      } else {
        setAverageRating(0);
        setReviewCount(0);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Грешка при зареждането на отзивите');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReview = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setUserReview(data);
    } catch (error) {
      console.error('Error fetching user review:', error);
    }
  };

  const onSubmitReview = async (data: ReviewForm) => {
    if (!user) {
      toast.error('Трябва да влезете в акаунта си за да оставите отзив');
      return;
    }

    try {
      if (editingReview) {
        // Update existing review
        const { error } = await supabase
          .from('reviews')
          .update({
            rating: data.rating,
            comment: data.comment.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingReview.id);

        if (error) throw error;
        toast.success('Отзивът е обновен');
      } else {
        // Create new review
        const { error } = await supabase
          .from('reviews')
          .insert({
            restaurant_id: restaurantId,
            user_id: user.id,
            rating: data.rating,
            comment: data.comment.trim() || null,
          });

        if (error) {
          if (error.code === '23505') {
            toast.error('Вече сте оставили отзив за този ресторант');
          } else {
            throw error;
          }
          return;
        }
        toast.success('Отзивът е добавен');
      }

      setShowAddReview(false);
      setEditingReview(null);
      reset();
      
      // Refresh data
      await fetchReviews();
      await fetchUserReview();
      
      // Dispatch custom event to refresh restaurant stats
      window.dispatchEvent(new CustomEvent('reviewChanged'));
    } catch (error) {
      console.error('Error saving review:', error);
      toast.error('Грешка при запазването на отзива');
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете този отзив?')) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      toast.success('Отзивът е изтрит');
      
      // Refresh data
      await fetchReviews();
      await fetchUserReview();
      
      // Dispatch custom event to refresh restaurant stats
      window.dispatchEvent(new CustomEvent('reviewChanged'));
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Грешка при изтриването на отзива');
    }
  };

  const startEditReview = (review: Tables<'reviews'>) => {
    setEditingReview(review);
    setValue('rating', review.rating);
    setValue('comment', review.comment || '');
    setShowAddReview(true);
  };

  const cancelEdit = () => {
    setShowAddReview(false);
    setEditingReview(null);
    reset();
  };

  const renderStars = (rating: number, interactive = false, onStarClick?: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={interactive && onStarClick ? () => onStarClick(star) : undefined}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <Star
              size={interactive ? 24 : 16}
              className={`${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mt-8" data-reviews-section>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Отзиви</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {renderStars(Math.round(averageRating))}
              <span className="text-lg font-medium text-gray-900">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <span className="text-gray-600">
              ({reviewCount} {reviewCount === 1 ? 'отзив' : 'отзива'})
            </span>
          </div>
        </div>

        {isAuthenticated && !userReview && (
          <button
            onClick={() => setShowAddReview(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Добави отзив</span>
          </button>
        )}
      </div>

      {/* User's Review */}
      {userReview && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-blue-900">Вашият отзив</span>
                {renderStars(userReview.rating)}
              </div>
              {userReview.comment && (
                <p className="text-blue-800">{userReview.comment}</p>
              )}
              <p className="text-xs text-blue-600 mt-2">
                {format(new Date(userReview.created_at), 'dd MMM yyyy, HH:mm', { locale: bg })}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => startEditReview(userReview)}
                className="text-blue-600 hover:text-blue-800 p-1 rounded"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => deleteReview(userReview.id)}
                className="text-red-600 hover:text-red-800 p-1 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Review Form */}
      {showAddReview && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">
              {editingReview ? 'Редактиране на отзив' : 'Добавяне на отзив'}
            </h4>
            <button
              onClick={cancelEdit}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmitReview)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Оценка *
              </label>
              <div className="flex items-center space-x-2">
                {renderStars(watchedRating, true, (rating) => setValue('rating', rating))}
                <span className="text-sm text-gray-600 ml-4">
                  {watchedRating} от 5 звезди
                </span>
              </div>
              <input
                type="hidden"
                {...register('rating', { required: 'Оценката е задължителна' })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Коментар
              </label>
              <textarea
                {...register('comment')}
                rows={4}
                placeholder={`Споделете вашето мнение за ${restaurantName}...`}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отказ
              </button>
              <button
                type="submit"
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                {editingReview ? 'Запази промените' : 'Публикувай отзив'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8">
            <Star size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">Все още няма отзиви за този ресторант</p>
            {isAuthenticated && (
              <p className="text-sm text-gray-500 mt-2">
                Бъдете първият, който ще остави отзив!
              </p>
            )}
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-start space-x-3">
                <div className="bg-gray-100 rounded-full p-2">
                  <User size={20} className="text-gray-600" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {review.user_name}
                    </span>
                    {renderStars(review.rating)}
                  </div>
                  
                  {review.comment && (
                    <p className="text-gray-700 mb-2">{review.comment}</p>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    {format(new Date(review.created_at), 'dd MMM yyyy, HH:mm', { locale: bg })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Предишна
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded ${
                    currentPage === page
                      ? 'bg-red-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Следваща
            </button>
          </div>
        )}
      </div>

      {/* Login Prompt */}
      {!isAuthenticated && (
        <div className="text-center py-6 border-t border-gray-200 mt-6">
          <p className="text-gray-600 mb-2">
            Влезте в акаунта си, за да оставите отзив
          </p>
          <a
            href="/auth"
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Вход / Регистрация
          </a>
        </div>
      )}
    </div>
  );
}