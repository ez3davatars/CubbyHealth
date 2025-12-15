import { useEffect, useState } from 'react';
import { ExternalLink, Building2, ChevronLeft, ChevronRight, LogOut, User, UserCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getMemberProfile, MemberUser } from '../lib/memberAuth';
import { getActivePartners, PartnerCompany } from '../lib/affiliateTracking';
import { getPartnerImages, PartnerImage, getOptimizedImageUrl } from '../lib/imageUpload';
import MemberProfile from './MemberProfile';

interface PartnerWithImages extends PartnerCompany {
  images: PartnerImage[];
}

function PartnerCard({
  partner,
  onPartnerClick,
}: {
  partner: PartnerWithImages;
  onPartnerClick: (partner: PartnerCompany) => void;
}) {
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const hasMultipleImages = partner.images.length > 1;
  const currentImage = partner.images[currentImageIndex];

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
          <img
            src={getOptimizedImageUrl(currentImage.image_url, { width: 800, quality: 85 })}
            alt={currentImage.caption || partner.name}
            loading="lazy"
            onLoad={() => setImageLoaded((prev) => ({ ...prev, [currentImage.id]: true }))}
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
                      idx === currentImageIndex ? 'bg-blue-600 w-4' : 'bg-gray-400 hover:bg-gray-600'
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
                <img
                  src={getOptimizedImageUrl(partner.logo_url, { width: 128, quality: 90 })}
                  alt={`${partner.name} logo`}
                  loading="lazy"
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
            <h4 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{partner.name}</h4>
            <div className="inline-block px-2.5 py-1 bg-cyan-100 text-cyan-800 text-xs font-semibold rounded-full">
              {partner.category}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-gray-600 leading-relaxed text-sm line-clamp-4">{partner.description}</p>
        </div>

        <div className="flex items-center justify-end pt-4 mt-auto border-t border-gray-100">
          <button
            onClick={() => onPartnerClick(partner)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 group/btn text-sm"
          >
            Visit Partner
            <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VendorPortal() {
  const [memberProfile, setMemberProfile] = useState<MemberUser | null>(null);
  const [partners, setPartners] = useState<PartnerWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showProfile, setShowProfile] = useState(false);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      window.location.href = '/member-login';
      return;
    }

    setUserId(session.user.id);

    const profile = await getMemberProfile(session.user.id);

    if (!profile) {
      await supabase.auth.signOut();
      window.location.href = '/member-login';
      return;
    }

    if (!profile.is_approved || !profile.is_active) {
      await supabase.auth.signOut();
      window.location.href = '/member-login';
      return;
    }

    setMemberProfile(profile);
    await loadPartners();
    setLoading(false);
  };

  const loadPartners = async () => {
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
  };

  const handlePartnerClick = async (partner: PartnerCompany) => {
    if (!memberProfile) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      console.error('No active session');
      return;
    }

    const clickData = {
      company_id: partner.id,
      member_user_id: memberProfile.id,
      user_agent: navigator.userAgent,
      referer: document.referrer || null,
      session_id: sessionStorage.getItem('affiliate_session_id') || null,
    };

    const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-click`;

    fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(clickData),
      keepalive: true,
    }).catch((error) => {
      console.error('Failed to track click:', error);
    });

    window.open(partner.affiliate_url, '_blank');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const groupedPartners = partners.reduce((acc, partner) => {
    if (!acc[partner.category]) acc[partner.category] = [];
    acc[partner.category].push(partner);
    return acc;
  }, {} as Record<string, PartnerWithImages[]>);

  const categories = Object.keys(groupedPartners);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor portal...</p>
        </div>
      </div>
    );
  }

  if (showProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <a href="/">
                  <img src="/Cubby Health.png" alt="Cubby Health" className="h-12" />
                </a>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Preferred Vendor Portal</h1>
                  <p className="text-sm text-gray-600">Welcome, {memberProfile?.full_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>
        <div className="py-8 px-4">
          <MemberProfile userId={userId} onBack={() => setShowProfile(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/">
                <img src="/Cubby Health.png" alt="Cubby Health" className="h-12" />
              </a>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Preferred Vendor Portal</h1>
                <p className="text-sm text-gray-600">Welcome, {memberProfile?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <UserCircle className="w-5 h-5" />
                <span className="text-sm font-medium">My Profile</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-block bg-cyan-100 text-cyan-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Exclusive Access
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              Our Preferred Vendors
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Click any vendor below to visit their website
            </p>
          </div>

          {categories.length > 0 && (
            <>
              <div className="overflow-x-auto mb-8 border-b border-gray-300 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex justify-start sm:justify-center gap-6 sm:gap-8 min-w-min">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`pb-4 font-semibold text-base sm:text-lg transition-all duration-300 relative whitespace-nowrap ${
                        selectedCategory === category ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedPartners[selectedCategory]?.map((partner) => (
                  <PartnerCard key={partner.id} partner={partner} onPartnerClick={handlePartnerClick} />
                ))}
              </div>
            </>
          )}

          {categories.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No vendors available at the moment.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
