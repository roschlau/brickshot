import {useAuthActions} from '@convex-dev/auth/react'
import {Authenticated, AuthLoading, Unauthenticated} from 'convex/react'
import {Button} from '@/components/ui/button.tsx'
import {GithubIcon} from '@/icons/GithubIcon.tsx'
import {LogOutIcon} from 'lucide-react'
import {ComponentProps, ReactNode, useState} from 'react'
import {Spinner} from '@/components/ui/spinner.tsx'
import {GoogleIcon} from '@/icons/GoogleIcon.tsx'
import {SimpleTooltip} from '@/components/ui/tooltip.tsx'
import {useLocalStorage} from 'usehooks-ts'

const LAST_AUTH_PROVIDER_KEY = 'auth:lastProvider'

export function AccountControls({
  variant,
}: {
  variant?: ComponentProps<typeof Button>['variant']
}) {
  const { signOut } = useAuthActions()
  return (
    <>
      <AuthLoading>Loading...</AuthLoading>
      <Unauthenticated>
        <GithubSignInButton variant={variant}/>
        <GoogleSignInButton variant={variant}/>
      </Unauthenticated>
      <Authenticated>
        <Button
          onClick={() => void signOut()}
          variant="outline"
        >
          <LogOutIcon/>
          Sign out
        </Button>
      </Authenticated>
    </>
  )
}

type AuthProvider = 'github' | 'google'

function SignInButton({ variant, provider, label, icon }: {
  variant?: ComponentProps<typeof Button>['variant']
  provider: AuthProvider
  label: string
  icon: ReactNode,
}) {
  const { signIn } = useAuthActions()
  const [loading, setLoading] = useState(false)
  const [lastProvider, setLastProvider] = useLocalStorage(LAST_AUTH_PROVIDER_KEY, null as AuthProvider | null)
  const clicked = async () => {
    setLoading(true)
    await signIn(provider)
    setLastProvider(provider)
  }
  const button = <Button
    variant={variant ?? 'default'}
    onClick={clicked}
    className={lastProvider === provider ? 'outline outline-primary' : ''}
  >
    {loading ? <Spinner/> : icon}
    {label}
  </Button>
  return (
    <div className="relative inline-flex">
      {lastProvider === provider ? (
        <SimpleTooltip text={'Last Used'}>
          {button}
        </SimpleTooltip>
      ) : button}
    </div>
  )
}

export function GithubSignInButton({ variant }: {
  variant?: ComponentProps<typeof Button>['variant']
}) {
  return (
    <SignInButton
      variant={variant}
      provider="github"
      label="Sign in with GitHub"
      icon={<GithubIcon/>}
    />
  )
}

export function GoogleSignInButton({ variant }: {
  variant?: ComponentProps<typeof Button>['variant']
}) {
  return (
    <SignInButton
      variant={variant}
      provider="google"
      label="Sign in with Google"
      icon={<GoogleIcon/>}
    />
  )
}
