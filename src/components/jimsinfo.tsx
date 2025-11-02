import { Building2, Award, Star } from "lucide-react";

export default function JIMSInfo() {
  const highlights = [
    {
      icon: Building2,
      label: "Modern Campus",
      desc: "Located in the heart of Delhi NCR",
    },
    {
      icon: Award,
      label: "Recognized Excellence",
      desc: "NAAC “A++” & NBA Accredited",
    },
    {
      icon: Star,
      label: "30+ Years Legacy",
      desc: "Trusted by students & industry alike",
    },
  ];

  return (
    <div className="space-y-6 text-white relative z-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold    text-white tracking-wide">
          Excellence Through Innovation
        </h2>
        <p className="text-white/95 text-sm max-w-md mx-auto leading-relaxed">
          A premier management institute in Delhi, nurturing leaders through
          innovation, values, and excellence since 1993.
        </p>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
        {highlights.map((item, idx) => (
          <div
            key={idx}
            className="group bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30
                       rounded-2xl p-4 text-center transition-all duration-300
                       backdrop-blur-lg shadow-soft hover:shadow-medium"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="p-2.5 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                <item.icon className="h-6 w-6 text-secondary" />
              </div>
              <div className="font-semibold text-sm">{item.label}</div>
              <div className="text-white/60 text-xs leading-snug max-w-[160px]">
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
