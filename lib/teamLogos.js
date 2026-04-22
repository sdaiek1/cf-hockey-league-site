export function getTeamLogoSrc(teamName = "") {
  const TEAM_LOGOS = {
    "Team Rasta": "/Rasta_Logo.JPG",
    "Zero Pucks Given": "/ZPG_Logo.PNG",
    "Mayhem": "/Mayhem_Logo.png",
    "Swiss Army": "/Swiss_Logo.PNG",
    "WCFD": "/WCFD_Logo.PNG",
    "H-Town Assassins": "/logo.png",
    "Replacements": "/logo.png",
    "Venom": "/Venom_Logo.JPG",
  };

  return TEAM_LOGOS[teamName] || "/logo.png";
}
