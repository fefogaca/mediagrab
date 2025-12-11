import Settings from '@backend/models/Settings';

interface GoogleOAuthConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
}

interface GitHubOAuthConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
}

export async function getGoogleOAuthConfig(): Promise<GoogleOAuthConfig> {
  const settings = await Settings.getSettings();
  const googleOAuthSettings = typeof settings.googleOAuth === 'string' 
    ? JSON.parse(settings.googleOAuth) 
    : settings.googleOAuth;
  
  return {
    enabled: googleOAuthSettings?.enabled || false,
    clientId: googleOAuthSettings?.clientId || '',
    clientSecret: googleOAuthSettings?.clientSecret || '',
  };
}

export async function getGitHubOAuthConfig(): Promise<GitHubOAuthConfig> {
  const settings = await Settings.getSettings();
  const githubOAuthSettings = typeof settings.githubOAuth === 'string' 
    ? JSON.parse(settings.githubOAuth) 
    : settings.githubOAuth;
  
  return {
    enabled: githubOAuthSettings?.enabled || false,
    clientId: githubOAuthSettings?.clientId || '',
    clientSecret: githubOAuthSettings?.clientSecret || '',
  };
}

