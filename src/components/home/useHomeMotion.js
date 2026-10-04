import { useEffect, useState } from 'react'
import { getMotionPolicy } from '../../lib/home-scroll'

/** 同步媒体查询和窗口宽度，运行中切换偏好也能安全停用三维。 */
export function useHomeMotion() {
    const readPolicy = () =>
        getMotionPolicy({
            width: window.innerWidth,
            coarse: window.matchMedia('(pointer: coarse)').matches,
            reduced: window.matchMedia('(prefers-reduced-motion: reduce)')
                .matches,
        })
    const [policy, setPolicy] = useState(readPolicy)
    useEffect(() => {
        const queries = [
            '(pointer: coarse)',
            '(prefers-reduced-motion: reduce)',
        ].map((query) => window.matchMedia(query))
        const update = () => setPolicy(readPolicy())
        queries.forEach((query) => query.addEventListener('change', update))
        window.addEventListener('resize', update, { passive: true })
        return () => {
            queries.forEach((query) =>
                query.removeEventListener('change', update),
            )
            window.removeEventListener('resize', update)
        }
    }, [])
    return policy
}
