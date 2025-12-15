import { useEffect, useState, useRef } from 'react';
import { ExternalLink, Building2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { getActivePartners, trackAffiliateClick, PartnerCompany } from '../lib/affiliateTracking';
import { getPartnerImages, PartnerImage, getOptimizedImageUrl } from '../lib/imageUpload';

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

interface PartnerWithImages extends PartnerCompany {
  images: PartnerImage[];
}

function PartnerCard({
  partner,
  onPartnerClick,
  isExpanded,
  onToggleExpand,
}: {
  partner: PartnerWithImages;
  onPartnerClick: (partner: PartnerCompany) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const hasMultipleImages = partner.images.length > 1;
  const currentImage = partner.images[currentImageIndex];

  // Preload adjacent images for smoother carousel transitions
  useEffect(() => {
    if (hasMultipleImages && currentImage) {
      const nextIndex = (currentImageIndex + 1) % partner.images.length;
      const prevIndex = currentImageIndex === 0 ? partner.images.length - 1 : currentImageIndex - 1;

      [nextIndex, prevIndex].forEach(idx => {
        const img = new Image();
        img.src = getOptimizedImageUrl(partner.images[idx].image_url, { width: 800, quality: 85 });
      });
    }
  }, [currentImageIndex, partner.images, hasMultipleImages, currentImage]);

  const goToPrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? partner.images.length - 1 : prev - 1));
  };

  const goToNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === partner.images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden border border-gray-100 group flex flex-col">
      {currentImage && (
        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
          {!imageLoaded[currentImage.id] && (
            <Skeleton className="absolute inset-0 h-full w-full" />
          )}
          <img
            src={getOptimizedImageUrl(currentImage.image_url, { width: 800, quality: 85 })}
            alt={currentImage.caption || partner.name}
            loading="eager"
            fetchpriority="high"
            decoding="async"
            onLoad={() => setImageLoaded(prev => ({ ...prev, [currentImage.id]: true }))}
            className={`max-w-full max-h-full object-contain transition-all duration-700 ${
              imageLoaded[currentImage.id] ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            } group-hover:scale-105`}
          />

          {hasMultipleImages && (
            <>
              <button
                onClick={goToPrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>

              <button
                onClick={goToNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg">
                {partner.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      idx === currentImageIndex
                        ? 'bg-blue-600 w-4'
                        : 'bg-gray-400 hover:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0">
            {partner.logo_url ? (
              <div className="relative w-16 h-16">
                {!logoLoaded && <Skeleton className="absolute inset-0 w-16 h-16 rounded-lg" />}
                <img
                  src={getOptimizedImageUrl(partner.logo_url, { width: 128, quality: 90 })}
                  alt={`${partner.name} logo`}
                  loading="eager"
                  fetchpriority="high"
                  decoding="async"
                  onLoad={() => setLogoLoaded(true)}
                  className={`w-16 h-16 object-contain rounded-lg bg-white shadow-sm border border-gray-200 p-2 transition-opacity duration-500 ${
                    logoLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center shadow-sm border border-blue-200">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
              {partner.name}
            </h4>
            <div className="inline-block px-2.5 py-1 bg-cyan-100 text-cyan-800 text-xs font-semibold rounded-full">
              {partner.category}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <p className={`text-gray-600 leading-relaxed text-sm transition-all duration-500 ease-in-out ${
            isExpanded ? '' : 'line-clamp-3'
          }`}>
            {partner.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100">
          {partner.description.length > 120 && (
            <button
              onClick={onToggleExpand}
              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
            >
              {isExpanded ? (
                <>
                  Less <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  More <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          <button
            onClick={() => onPartnerClick(partner)}
            className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 group/btn text-sm"
          >
            Sign In to Access
            <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryCarousel({
  partners,
  onPartnerClick
}: {
  partners: PartnerWithImages[];
  onPartnerClick: (partner: PartnerCompany) => void;
}) {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const handleToggleExpand = (partnerId: string) => {
    setExpandedCardId(prev => prev === partnerId ? null : partnerId);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedCardId) {
        setExpandedCardId(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [expandedCardId]);

  if (partners.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No partners in this category yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-0">
      {partners.map((partner) => (
        <PartnerCard
          key={partner.id}
          partner={partner}
          onPartnerClick={onPartnerClick}
          isExpanded={expandedCardId === partner.id}
          onToggleExpand={() => handleToggleExpand(partner.id)}
        />
      ))}
    </div>
  );
}

export default function Partners() {
  const [partners, setPartners] = useState<PartnerWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Add DNS prefetch hints for partner domains to speed up navigation
  useEffect(() => {
    partners.forEach((partner) => {
      try {
        const url = new URL(partner.affiliate_url);
        const hostname = url.hostname;

        // Check if prefetch link already exists
        if (!document.querySelector(`link[rel="dns-prefetch"][href="//${hostname}"]`)) {
          const prefetchLink = document.createElement('link');
          prefetchLink.rel = 'dns-prefetch';
          prefetchLink.href = `//${hostname}`;
          document.head.appendChild(prefetchLink);

          // Also add preconnect for even faster connection
          const preconnectLink = document.createElement('link');
          preconnectLink.rel = 'preconnect';
          preconnectLink.href = `${url.protocol}//${hostname}`;
          document.head.appendChild(preconnectLink);
        }
      } catch (error) {
        console.warn('Failed to add DNS prefetch for partner:', partner.name, error);
      }
    });
  }, [partners]);

  useEffect(() => {
    async function loadPartners() {
      const data = await getActivePartners();
      const partnersWithImages = await Promise.all(
        data.map(async (partner) => {
          const images = await getPartnerImages(partner.id);
          const productImages = images.filter((img) => img.image_type === 'product');
          return { ...partner, images: productImages };
        })
      );
      setPartners(partnersWithImages);

      const categories = Array.from(new Set(partnersWithImages.map((p) => p.category)));
      if (categories.length > 0) {
        setSelectedCategory(categories[0]);
      }

      setLoading(false);
    }
    loadPartners();
  }, []);


  const handlePartnerClick = (company: PartnerCompany) => {
    sessionStorage.setItem('intended_partner', JSON.stringify({
      id: company.id,
      name: company.name
    }));
    window.location.href = '/member-login';
  };

  const groupedPartners = partners.reduce((acc, partner) => {
    if (!acc[partner.category]) acc[partner.category] = [];
    acc[partner.category].push(partner);
    return acc;
  }, {} as Record<string, PartnerWithImages[]>);

  const categories = Object.keys(groupedPartners);

  if (loading) {
    return (
      <section id="partners" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <Skeleton className="h-12 w-80 mx-auto" />
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>
            <div className="flex gap-8 border-b border-gray-200">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-32" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-96 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section id="partners" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Partners</h2>
          <p className="text-gray-600">No partners available at the moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="partners" className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-block bg-cyan-100 text-cyan-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            Our Vendors
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Trusted Partner Companies
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Collaborating with industry leaders to deliver exceptional dental care solutions
          </p>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl max-w-2xl mx-auto">
            <p className="text-sm text-blue-900 font-medium">
              Member access required to visit our preferred vendors.{' '}
              <a href="/member-register" className="underline hover:text-blue-700">
                Register here
              </a>
              {' '}or{' '}
              <a href="/member-login" className="underline hover:text-blue-700">
                sign in
              </a>
              {' '}to get started.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto mb-8 border-b border-gray-300 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <div className="flex justify-start sm:justify-center gap-6 sm:gap-8 min-w-min">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`pb-4 font-semibold text-base sm:text-lg transition-all duration-300 relative whitespace-nowrap ${
                  selectedCategory === category
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {category}
                {selectedCategory === category && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <CategoryCarousel
            key={selectedCategory}
            partners={groupedPartners[selectedCategory] || []}
            onPartnerClick={handlePartnerClick}
          />
        </div>
      </div>
    </section>
  );
}
