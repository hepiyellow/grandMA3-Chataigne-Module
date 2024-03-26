-- This file is an initial quick & dirty stub for the MA3 plugin that will send Chataigne
-- the mapping data (sequence -> executor)
-- It is a partial port (WIP) fro TypeScript.
-- It is useing some of ma3-pro-plugins' infrastructure and utils. (these need to be replaced)

function syncMapping() 
    
    local oscRemoteNumber = 2; -- needs to be configurable

    local addressPrefix = '/ma3/chataigne_companion/seq2exec';
    

    Cmd('SendOSC ' .. oscRemoteNumber .. addressPrefix .. '/reset,s,1'); -- argument 1 is arbitrary stub
    
    -- for page of all pages do
        --for exec of all of the page's executors do
            if (exec.isAssigned()) then -- check if the exec is assigned
                if (exec.isTargetSequence()) then -- check if the exec's target is a sequence
                    local seq = exec.getTargetObject() -- get the target sequence object
                    local seqIndex = seq.index
                    local faderType = exec.getObj().fader
                    local faderValue = exec.getFaderValue()
                    local address = addressPrefix;
                    Cmd(
                        'SendOSC ' .. oscRemoteNumber .. '"' .. address .. ',ssiii,' .. seqIndex ..',' .. faderType .. ',' ..page.index .. ',' ..exec.index ..','..faderValue ..'"'
                    );
                end
            end
        --end
    --end
end

function initHooks() 
    context.hooks.hookPluginEvent(
        'execPageChange',
        CurrentProfile(),
        (event) => {
            -- What should we do here? don't really need to sycn everything
            ExecMapping(context).syncMapping()
        },
        { propertyChangeFilter: ['selectedPage'] }
    )

    -- for page of all pages do
        --for exec of all of the page's executors do
            if (exec.exists()) {
                exec.hook( -- need to use HookObjectChange
                    function (newObj)  
                        syncMapping()
                    end
                )
            }
        --end
    --end
end