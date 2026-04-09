// useDestinations.ts
import api from '@/lib/api';
import { useState, useEffect } from 'react';

type Destinations = {
  youtube: boolean;
  twitch: boolean;
  facebook: boolean;
  // Add more properties as needed
};

const useDestinations = () => {
  const [ytAdded, setYtAdded] = useState(false);
  const [twitchAdded, setTwitchAdded] = useState(false);
  const [fbAdded, setFbAdded] = useState(false);

  useEffect(() => {
    updateDestinations();
  }, []);

  async function getDestinations(): Promise<Destinations | undefined> {
    try {
      const response = await api.get<Destinations>('/destinations/');
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getting destinations : ', error);
    }
  }

  async function removeDestinations(platform: string) {
    const payload = {
      platform: platform,
    };

    try {
      const response = await api.post('/destinations/remove', payload);
      if (response.data) {
        console.log(response.data);
        switch (platform) {
          case 'Youtube':
            setYtAdded(false);
            break;
          case 'Twitch':
            setTwitchAdded(false);
            break;
          case 'Facebook':
            setFbAdded(false);
            break;
          default:
            throw new Error(`Unknown platform ${platform}`);
        }
      }
    } catch (error) {
      console.error('Error in removing destinations : ', error);
    }
  }

  async function updateDestinations() {
    const destination = await getDestinations();
    if (destination) {
      if (destination.youtube) {
        setYtAdded(true);
        console.log('Youtube added from db', destination.youtube);
      }
      if (destination.facebook) {
        setFbAdded(true);
        console.log('Facebook added from db', destination.facebook);
      }
      if (destination.twitch) {
        setTwitchAdded(true);
        console.log('Twitch added from db', destination.twitch);
      }
    }
  }

  return { ytAdded, twitchAdded, fbAdded, removeDestinations, updateDestinations };
};

export default useDestinations;
//@ts-ignore

if (newStatus === "completed" || newStatus === "reviewing") {
  //@ts-ignore
  scanToMove = { ...scanToMove, status: newStatus };
} else {
  // handle invalid status, e.g. throw error or ignore
}

