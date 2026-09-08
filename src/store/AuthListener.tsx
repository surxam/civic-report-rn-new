import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { bootstrapSession, fetchProfile, sessionChanged, selectSession } from "./authSlice";
import { useAppDispatch, useAppSelector } from "./hooks";

/**
 * Ne rend rien : synchronise la session Supabase (persistée + temps réel) avec le store Redux.
 * Monté une seule fois à la racine de l'app, sous le <Provider store={store}>.
 */
export default function AuthListener(): null {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectSession);

  useEffect(() => {
    dispatch(bootstrapSession());
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      dispatch(sessionChanged(newSession));
    });
    return () => subscription.subscription.unsubscribe();
  }, [dispatch]);

  useEffect(() => {
    if (session?.user?.id) {
      dispatch(fetchProfile(session.user.id));
    }
  }, [dispatch, session?.user?.id]);

  return null;
}
