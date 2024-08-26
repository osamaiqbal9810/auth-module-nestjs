import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";

export interface GoogleProfile {
    id: string;
    emails: { value: string }[]
    name: {
      givenName: string;
      familyName: string;
    };
    photos: { value: string }[]
  }

  
export interface GoogleProfileTranslated {
    provider: string,
    providerId: string,
    email: string
    name: string
    picture: string
    accessToken: string
    refreshToken: string
  }


@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor() {
        super({
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL: 'http://127.0.0.1:3000/auth/google/callback',
            scope: ['email', 'profile']
        })
    }

    async validate(accessToken: string, refreshToken: string, profile: GoogleProfile, done: VerifyCallback): Promise<void> {
        const { id, name, emails, photos } = profile;
        const user = {
            provider: 'google',
            providerId: id,
            email: emails[0].value,
            name: `${name.givenName} ${name.familyName}`,
            picture: photos[0].value,
            accessToken,
            refreshToken
          };
      
         done(null, user);
    }
 }