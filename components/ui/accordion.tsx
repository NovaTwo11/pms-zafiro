import React, { createContext, useCallback, useContext, useId, useMemo, useRef, useState, useEffect, forwardRef } from "react"

type AccordionType = "single" | "multiple"

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
    type?: AccordionType
    collapsible?: boolean
    defaultValue?: string | string[]
}

interface AccordionContextValue {
    openValues: Set<string>
    toggleValue: (value: string) => void
    isOpen: (value: string) => boolean
    type: AccordionType
    collapsible: boolean
}

const AccordionContext = createContext<AccordionContextValue | null>(null)

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
    ({ children, type = "single", collapsible = true, defaultValue, className = "", ...props }, ref) => {
        const parsedDefault = useMemo(() => {
            if (!defaultValue) return new Set<string>()
            if (Array.isArray(defaultValue)) return new Set(defaultValue)
            return new Set([defaultValue])
        }, [defaultValue])

        const [openValues, setOpenValues] = useState<Set<string>>(parsedDefault)

        const toggleValue = useCallback(
            (value: string) => {
                setOpenValues(prev => {
                    const next = new Set(prev)
                    const isOpen = next.has(value)

                    if (isOpen) {
                        if (!collapsible && next.size === 1) return prev
                        next.delete(value)
                        return next
                    }

                    // opening
                    if (type === "single") {
                        // replace
                        return new Set([value])
                    }

                    next.add(value)
                    return next
                })
            },
            [type, collapsible]
        )

        const isOpen = useCallback((value: string) => openValues.has(value), [openValues])

        const ctx = useMemo(
            () => ({ openValues, toggleValue, isOpen, type, collapsible }),
            [openValues, toggleValue, isOpen, type, collapsible]
        )

        return (
            <AccordionContext.Provider value={ctx}>
                <div ref={ref} className={className} {...props}>
                    {children}
                </div>
            </AccordionContext.Provider>
        )
    }
)
Accordion.displayName = "Accordion"

// ---------- AccordionItem ----------
interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string
}

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(({ children, value, className = "", ...props }, ref) => {
    const ctx = useContext(AccordionContext)
    if (!ctx) throw new Error("AccordionItem must be used inside Accordion")

    const id = useId()
    return (
        <div ref={ref} className={`${className}`} data-accordion-value={value} {...props}>
            {React.Children.map(children, child => {
                // we just render children; Trigger/Content components will use context + value to connect
                return child
            })}
        </div>
    )
})
AccordionItem.displayName = "AccordionItem"

// ---------- AccordionTrigger ----------
interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode
}

export const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(({ children, className = "", ...props }, ref) => {
    const ctx = useContext(AccordionContext)
    if (!ctx) throw new Error("AccordionTrigger must be used inside Accordion")

    // The value is passed via data attribute on parent AccordionItem in user's markup.
    // We'll walk up the DOM to find the nearest ancestor with data-accordion-value
    const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        const btn = e.currentTarget
        let el: HTMLElement | null = btn
        while (el && !el.dataset.accordionValue) {
            el = el.parentElement
        }
        const value = el?.dataset.accordionValue
        if (!value) return
        ctx.toggleValue(value)
    }

    // compute aria-expanded based on value
    // Set aria-controls to link with content via id convention
    const computeAria = () => {
        // find parent value
        return undefined
    }

    return (
        <button
            ref={ref}
            type="button"
            onClick={handleClick}
            className={className}
            {...props}
        >
            {children}
        </button>
    )
})
AccordionTrigger.displayName = "AccordionTrigger"

// ---------- AccordionContent ----------
interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

export const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(({ children, className = "", ...props }, ref) => {
    const ctx = useContext(AccordionContext)
    if (!ctx) throw new Error("AccordionContent must be used inside Accordion")

    const elRef = useRef<HTMLDivElement | null>(null)
    // We'll merge refs so the user ref gets elRef
    useEffect(() => {
        // noop
    }, [])

    // find value by walking DOM from this content up to item
    useEffect(() => {
        // nothing here; visibility is computed on render
    }, [ctx.openValues])

    // helper to determine whether this content should be visible based on nearest ancestor
    const isThisOpen = () => {
        if (!elRef.current) return false
        let el: HTMLElement | null = elRef.current
        while (el && !el.dataset.accordionValue) {
            el = el.parentElement
        }
        const value = el?.dataset.accordionValue
        if (!value) return false
        return ctx.openValues.has(value)
    }

    const [height, setHeight] = useState<string | number>(0)
    const visible = isThisOpen()

    useEffect(() => {
        const node = elRef.current
        if (!node) return
        if (visible) {
            const scroll = node.scrollHeight
            setHeight(scroll)
        } else {
            setHeight(0)
        }
    }, [visible, children])

    return (
        // container used to animate collapse/expand
        <div
            ref={(node) => {
                elRef.current = node
                if (typeof ref === "function") ref(node)
                else if (ref && "current" in ref) (ref as any).current = node
            }}
            role="region"
            aria-hidden={!visible}
            style={{
                maxHeight: typeof height === "number" ? `${height}px` : height,
                overflow: "hidden",
                transition: "max-height 200ms ease",
            }}
            className={className}
            {...props}
        >
            <div className="pt-2 pb-3">{children}</div>
        </div>
    )
})
AccordionContent.displayName = "AccordionContent"

export default Accordion
